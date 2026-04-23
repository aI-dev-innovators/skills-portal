import { getServerSupabaseClient } from '../db/supabase';
import { CATALOG_TTL, getCatalogCache, invalidateCatalogCache, setCatalogCache } from '../cache/catalog-cache';
import type { RepositoryRecord } from './types';
import { logSupabaseError } from './supabase-errors';

function repositoryCacheKey(repositoryId: string): string {
  return `repositories:${repositoryId}`;
}

export async function getRepositoryById(repositoryId: string): Promise<RepositoryRecord | null> {
  const cached = getCatalogCache<RepositoryRecord>(repositoryCacheKey(repositoryId));
  if (cached) return cached;

  const supabase = getServerSupabaseClient();
  const { data, error } = await supabase
    .from('repositories')
    .select('*')
    .eq('repository_id', repositoryId)
    .maybeSingle();

  if (error) {
    logSupabaseError({ operation: 'getRepositoryById', table: 'repositories', payload: { repositoryId } }, error);
    throw new Error(`No se pudo leer repositories: ${error.message}`);
  }

  if (!data) return null;

  setCatalogCache(repositoryCacheKey(repositoryId), data, CATALOG_TTL.repositories);
  return data as RepositoryRecord;
}

export async function upsertRepository(input: RepositoryRecord & { tags?: string[] }): Promise<RepositoryRecord> {
  const supabase = getServerSupabaseClient();
  const payload: RepositoryRecord = {
    repository_id: input.repository_id.trim(),
    repository_name: input.repository_name.trim(),
    full_name: input.full_name.trim(),
    github_url: input.github_url.trim(),
    description: input.description?.trim() || null,
    is_active: input.is_active ?? true
  };

  const { data, error } = await supabase
    .from('repositories')
    .upsert(payload, { onConflict: 'repository_id' })
    .select('*')
    .single();

  if (error) {
    logSupabaseError({ operation: 'upsertRepository', table: 'repositories', payload }, error);
    throw new Error(`No se pudo guardar repositories: ${error.message}`);
  }

  const normalizedTags = Array.from(
    new Set((input.tags || []).map((tag) => tag.trim()).filter((tag) => tag.length > 0))
  );

  const { error: deleteTagsError } = await supabase
    .from('repository_tags')
    .delete()
    .eq('repository_id', data.repository_id);

  if (deleteTagsError) {
    logSupabaseError(
      { operation: 'upsertRepository.deleteTags', table: 'repository_tags', payload: { repositoryId: data.repository_id } },
      deleteTagsError
    );
    throw new Error(`No se pudieron actualizar los tags de repositories: ${deleteTagsError.message}`);
  }

  if (normalizedTags.length > 0) {
    const tagRows = normalizedTags.map((tag) => ({ repository_id: data.repository_id, tag }));
    const { error: insertTagsError } = await supabase.from('repository_tags').insert(tagRows);

    if (insertTagsError) {
      logSupabaseError(
        { operation: 'upsertRepository.insertTags', table: 'repository_tags', payload: { repositoryId: data.repository_id, tags: normalizedTags } },
        insertTagsError
      );
      throw new Error(`No se pudieron guardar los tags de repositories: ${insertTagsError.message}`);
    }
  }

  invalidateCatalogCache(repositoryCacheKey(payload.repository_id));
  setCatalogCache(repositoryCacheKey(data.repository_id), data, CATALOG_TTL.repositories);
  return data as RepositoryRecord;
}

export async function deleteRepository(repositoryId: string): Promise<void> {
  const supabase = getServerSupabaseClient();
  const { error } = await supabase.from('repositories').delete().eq('repository_id', repositoryId);

  if (error) {
    logSupabaseError({ operation: 'deleteRepository', table: 'repositories', payload: { repositoryId } }, error);
    throw new Error(`No se pudo eliminar repositories: ${error.message}`);
  }

  invalidateCatalogCache(repositoryCacheKey(repositoryId));
}
