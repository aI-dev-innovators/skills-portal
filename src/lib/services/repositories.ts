import { getServerSupabaseClient } from '../db/supabase';
import { CATALOG_TTL, getCatalogCache, setCatalogCache } from '../cache/catalog-cache';
import type { RepositoryRecord } from './types';
import { logSupabaseError } from './supabase-errors';

function repositoryCacheKey(repositoryId: string): string {
  return `repositories:${repositoryId}`;
}

export async function upsertRepository(input: RepositoryRecord): Promise<RepositoryRecord> {
  const supabase = getServerSupabaseClient();

  const payload: RepositoryRecord = {
    repository_id: input.repository_id,
    repository_name: input.repository_name,
    full_name: input.full_name,
    github_url: input.github_url,
    description: input.description || null,
    is_active: input.is_active ?? true
  };

  const { data, error } = await supabase
    .from('repositories')
    .upsert(payload, { onConflict: 'repository_id' })
    .select()
    .single();

  if (error) {
    logSupabaseError({ operation: 'upsertRepository', table: 'repositories', payload }, error);
    throw new Error(`No se pudo upsert repositories: ${error.message}`);
  }

  setCatalogCache(repositoryCacheKey(data.repository_id), data, CATALOG_TTL.repositories);
  return data as RepositoryRecord;
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
