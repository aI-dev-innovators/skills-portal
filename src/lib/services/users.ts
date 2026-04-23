import { getServerSupabaseClient } from '../db/supabase';
import { CATALOG_TTL, getCatalogCache, setCatalogCache } from '../cache/catalog-cache';
import type { UserRecord } from './types';
import { logSupabaseError } from './supabase-errors';

function userCacheKey(userId: string): string {
  return `users:${userId}`;
}

export async function upsertUser(input: UserRecord): Promise<UserRecord> {
  const supabase = getServerSupabaseClient();

  const payload: Partial<UserRecord> & Pick<UserRecord, 'user_id' | 'email'> = {
    user_id: input.user_id,
    email: input.email,
    display_name: input.display_name || null,
    provider: input.provider || null,
    last_seen_at: input.last_seen_at || new Date().toISOString(),
    is_active: input.is_active ?? true
  };

  if (input.last_login_at) {
    payload.last_login_at = input.last_login_at;
  }

  const { data, error } = await supabase
    .from('users')
    .upsert(payload, { onConflict: 'user_id' })
    .select()
    .single();

  if (!error && data) {
    setCatalogCache(userCacheKey(data.user_id), data, CATALOG_TTL.users);
    return data as UserRecord;
  }

  const upsertError = error;

  if (upsertError && (upsertError.code === '23505' || upsertError.message.includes('users_email_key'))) {
    const { data: existingByEmail, error: lookupError } = await supabase
      .from('users')
      .select('*')
      .eq('email', input.email)
      .maybeSingle();

    if (lookupError) {
      logSupabaseError(
        { operation: 'upsertUser.lookupByEmail', table: 'users', payload: { email: input.email } },
        lookupError
      );
      throw new Error(`No se pudo resolver users por email: ${lookupError.message}`);
    }

    if (!existingByEmail) {
      logSupabaseError({ operation: 'upsertUser', table: 'users', payload }, upsertError);
      throw new Error(`No se pudo upsert users: ${upsertError.message}`);
    }

    const updatePayload: Partial<UserRecord> = {
      display_name: payload.display_name,
      provider: payload.provider,
      last_seen_at: payload.last_seen_at,
      is_active: payload.is_active
    };

    if (input.last_login_at) {
      updatePayload.last_login_at = input.last_login_at;
    }

    const { data: updated, error: updateError } = await supabase
      .from('users')
      .update(updatePayload)
      .eq('email', input.email)
      .select()
      .single();

    if (updateError || !updated) {
      const finalError = updateError || upsertError;
      logSupabaseError(
        { operation: 'upsertUser.updateByEmail', table: 'users', payload: { ...payload, matchedUserId: existingByEmail.user_id } },
        finalError
      );
      throw new Error(`No se pudo actualizar users por email: ${finalError.message}`);
    }

    setCatalogCache(userCacheKey(updated.user_id), updated, CATALOG_TTL.users);
    return updated as UserRecord;
  }

  if (upsertError) {
    logSupabaseError({ operation: 'upsertUser', table: 'users', payload }, upsertError);
    throw new Error(`No se pudo upsert users: ${upsertError.message}`);
  }

  throw new Error('No se pudo upsert users: error desconocido');
}

export async function getUserById(userId: string): Promise<UserRecord | null> {
  const cached = getCatalogCache<UserRecord>(userCacheKey(userId));
  if (cached) return cached;

  const supabase = getServerSupabaseClient();
  const { data, error } = await supabase
    .from('users')
    .select('*')
    .eq('user_id', userId)
    .maybeSingle();

  if (error) {
    logSupabaseError({ operation: 'getUserById', table: 'users', payload: { userId } }, error);
    throw new Error(`No se pudo leer users: ${error.message}`);
  }

  if (!data) return null;
  setCatalogCache(userCacheKey(userId), data, CATALOG_TTL.users);
  return data as UserRecord;
}

export async function touchUserLastSeen(userId: string): Promise<void> {
  const supabase = getServerSupabaseClient();
  const { error } = await supabase
    .from('users')
    .update({ last_seen_at: new Date().toISOString() })
    .eq('user_id', userId);

  if (error) {
    logSupabaseError({ operation: 'touchUserLastSeen', table: 'users', payload: { userId } }, error);
    throw new Error(`No se pudo actualizar last_seen_at: ${error.message}`);
  }
}
