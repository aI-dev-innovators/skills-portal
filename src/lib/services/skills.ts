import { getServerSupabaseClient } from '../db/supabase';
import { CATALOG_TTL, getCatalogCache, setCatalogCache } from '../cache/catalog-cache';
import type { SkillRecord } from './types';
import { logSupabaseError } from './supabase-errors';

function skillCacheKey(skillId: string): string {
  return `skills:${skillId}`;
}

export async function upsertSkill(input: SkillRecord): Promise<SkillRecord> {
  const supabase = getServerSupabaseClient();

  const payload: SkillRecord = {
    skill_id: input.skill_id,
    skill_name: input.skill_name,
    category: input.category || null,
    repository_id: input.repository_id,
    description: input.description || null,
    is_active: input.is_active ?? true
  };

  const { data, error } = await supabase
    .from('skills')
    .upsert(payload, { onConflict: 'skill_id' })
    .select()
    .single();

  if (error) {
    logSupabaseError({ operation: 'upsertSkill', table: 'skills', payload }, error);
    throw new Error(`No se pudo upsert skills: ${error.message}`);
  }

  setCatalogCache(skillCacheKey(data.skill_id), data, CATALOG_TTL.skills);
  return data as SkillRecord;
}

export async function getSkillById(skillId: string): Promise<SkillRecord | null> {
  const cached = getCatalogCache<SkillRecord>(skillCacheKey(skillId));
  if (cached) return cached;

  const supabase = getServerSupabaseClient();
  const { data, error } = await supabase
    .from('skills')
    .select('*')
    .eq('skill_id', skillId)
    .maybeSingle();

  if (error) {
    logSupabaseError({ operation: 'getSkillById', table: 'skills', payload: { skillId } }, error);
    throw new Error(`No se pudo leer skills: ${error.message}`);
  }

  if (!data) return null;

  setCatalogCache(skillCacheKey(skillId), data, CATALOG_TTL.skills);
  return data as SkillRecord;
}
