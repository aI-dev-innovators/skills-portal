import { createClient, type SupabaseClient } from '@supabase/supabase-js';

function resolvePublicUrl(): string {
  const url = import.meta.env.PUBLIC_SUPABASE_URL;
  if (!url) {
    throw new Error('Falta PUBLIC_SUPABASE_URL en variables de entorno.');
  }
  return url;
}

function resolvePublicKey(): string {
  const key = import.meta.env.PUBLIC_SUPABASE_PUBLISHABLE_KEY;
  if (!key) {
    throw new Error('Falta PUBLIC_SUPABASE_PUBLISHABLE_KEY en variables de entorno.');
  }
  return key;
}

export const supabaseBrowser = createClient(resolvePublicUrl(), resolvePublicKey());

let serverClient: SupabaseClient | null = null;

export function getServerSupabaseClient(): SupabaseClient {
  if (serverClient) {
    return serverClient;
  }

  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  const key = serviceRoleKey || resolvePublicKey();

  serverClient = createClient(resolvePublicUrl(), key, {
    auth: {
      persistSession: false,
      autoRefreshToken: false
    }
  });

  return serverClient;
}
