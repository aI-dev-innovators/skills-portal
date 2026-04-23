import { getServerSupabaseClient } from '../db/supabase';
import type {
  LoginEventRecord,
  RepositoryViewEventRecord,
  SkillFeedbackRecord,
  SkillViewEventRecord
} from './types';
import { logSupabaseError } from './supabase-errors';

const DUPLICATE_WINDOW_SECONDS = 30;

export async function insertLoginEvent(input: LoginEventRecord): Promise<void> {
  const supabase = getServerSupabaseClient();
  const { error } = await supabase.from('login_events').insert(input);

  if (error) {
    logSupabaseError({ operation: 'insertLoginEvent', table: 'login_events', payload: input }, error);
    throw new Error(`No se pudo insertar login_event: ${error.message}`);
  }
}

async function hasRecentSkillViewDuplicate(input: SkillViewEventRecord): Promise<boolean> {
  const supabase = getServerSupabaseClient();
  const threshold = new Date(Date.now() - DUPLICATE_WINDOW_SECONDS * 1000).toISOString();

  const { data, error } = await supabase
    .from('skill_views')
    .select('skill_view_id')
    .eq('user_id', input.user_id)
    .eq('skill_id', input.skill_id)
    .gte('viewed_at', threshold)
    .limit(1);

  if (error) {
    logSupabaseError(
      { operation: 'hasRecentSkillViewDuplicate', table: 'skill_views', payload: input },
      error
    );
    throw new Error(`No se pudo validar duplicados de skill_views: ${error.message}`);
  }

  return (data || []).length > 0;
}

async function hasRecentRepositoryViewDuplicate(input: RepositoryViewEventRecord): Promise<boolean> {
  const supabase = getServerSupabaseClient();
  const threshold = new Date(Date.now() - DUPLICATE_WINDOW_SECONDS * 1000).toISOString();

  const { data, error } = await supabase
    .from('repository_views')
    .select('repository_view_id')
    .eq('user_id', input.user_id)
    .eq('repository_id', input.repository_id)
    .gte('viewed_at', threshold)
    .limit(1);

  if (error) {
    logSupabaseError(
      { operation: 'hasRecentRepositoryViewDuplicate', table: 'repository_views', payload: input },
      error
    );
    throw new Error(`No se pudo validar duplicados de repository_views: ${error.message}`);
  }

  return (data || []).length > 0;
}

export async function insertSkillView(input: SkillViewEventRecord): Promise<{ inserted: boolean }> {
  const isDuplicate = await hasRecentSkillViewDuplicate(input);
  if (isDuplicate) {
    return { inserted: false };
  }

  const supabase = getServerSupabaseClient();
  const { error } = await supabase.from('skill_views').insert(input);

  if (error) {
    logSupabaseError({ operation: 'insertSkillView', table: 'skill_views', payload: input }, error);
    throw new Error(`No se pudo insertar skill_view: ${error.message}`);
  }

  return { inserted: true };
}

export async function insertRepositoryView(
  input: RepositoryViewEventRecord
): Promise<{ inserted: boolean }> {
  const isDuplicate = await hasRecentRepositoryViewDuplicate(input);
  if (isDuplicate) {
    return { inserted: false };
  }

  const supabase = getServerSupabaseClient();
  const { error } = await supabase.from('repository_views').insert(input);

  if (error) {
    logSupabaseError({ operation: 'insertRepositoryView', table: 'repository_views', payload: input }, error);
    throw new Error(`No se pudo insertar repository_view: ${error.message}`);
  }

  return { inserted: true };
}

export async function insertSkillFeedback(input: SkillFeedbackRecord): Promise<void> {
  const supabase = getServerSupabaseClient();
  const { error } = await supabase.from('skill_feedback').insert(input);

  if (error) {
    logSupabaseError({ operation: 'insertSkillFeedback', table: 'skill_feedback', payload: input }, error);
    throw new Error(`No se pudo insertar skill_feedback: ${error.message}`);
  }
}

export async function getTopSkills(limit = 10): Promise<Array<{ skill_name: string; views: number }>> {
  const supabase = getServerSupabaseClient();
  const { data, error } = await supabase.rpc('analytics_top_skills', { top_limit: limit });

  if (error) {
    return [];
  }

  return (data || []) as Array<{ skill_name: string; views: number }>;
}

export async function getTopRepositories(
  limit = 10
): Promise<Array<{ repository_name: string; views: number }>> {
  const supabase = getServerSupabaseClient();
  const { data, error } = await supabase.rpc('analytics_top_repositories', { top_limit: limit });

  if (error) {
    return [];
  }

  return (data || []) as Array<{ repository_name: string; views: number }>;
}

export async function getActiveUsers(
  limit = 50
): Promise<Array<{ email: string; last_login_at: string }>> {
  const supabase = getServerSupabaseClient();
  const { data, error } = await supabase.rpc('analytics_active_users', { top_limit: limit });

  if (error) {
    return [];
  }

  return (data || []) as Array<{ email: string; last_login_at: string }>;
}
