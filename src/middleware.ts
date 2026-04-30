import type { MiddlewareHandler } from 'astro';
import { auth, canManageRepositories, isAllowedEmailDomain } from './lib/auth';
import { upsertUser } from './lib/services/users';

const authDebugEnabled =
  (import.meta.env.AUTH_DEBUG_LOGS || process.env.AUTH_DEBUG_LOGS || '').toLowerCase() === 'true';

function authDebugLog(message: string, meta?: Record<string, unknown>): void {
  if (!authDebugEnabled) return;
  if (meta) {
    console.log(`[auth-debug] ${message}`, meta);
    return;
  }
  console.log(`[auth-debug] ${message}`);
}

function isAssetPath(pathname: string): boolean {
  return /\.[a-zA-Z0-9]+$/.test(pathname) || pathname.startsWith('/_astro/');
}

function hasValidCronSecret(request: Request): boolean {
  const expected = process.env.CATALOG_SYNC_SECRET || process.env.CRON_SECRET;
  if (!expected) return false;

  const header = request.headers.get('x-catalog-sync-secret') || request.headers.get('authorization') || '';
  const token = header.startsWith('Bearer ') ? header.slice('Bearer '.length).trim() : header.trim();
  return token.length > 0 && token === expected;
}

const USER_SYNC_TTL_MS = 5 * 60 * 1000;
const userSyncCache = new Map<string, number>();

async function syncUserToCatalog(user: { id: string; email?: string | null; name?: string | null }): Promise<void> {
  if (!user?.id || !user?.email) return;

  const now = Date.now();
  const nextAllowedSync = userSyncCache.get(user.id) || 0;
  if (nextAllowedSync > now) return;

  const timestamp = new Date().toISOString();
  const firstSync = !userSyncCache.has(user.id);

  await upsertUser({
    user_id: user.id,
    email: user.email,
    display_name: user.name || null,
    provider: 'github',
    last_seen_at: timestamp,
    last_login_at: firstSync ? timestamp : undefined,
    is_active: true
  });

  userSyncCache.set(user.id, now + USER_SYNC_TTL_MS);
}

export const onRequest: MiddlewareHandler = async (context, next) => {
  const { pathname } = context.url;
  const req = context.request;
  const isAuthRoute = pathname.startsWith('/api/auth');
  const isCatalogSyncRoute = pathname === '/api/admin/catalog-sync';

  if (isAuthRoute) {
    authDebugLog('Incoming auth route request', {
      method: req.method,
      pathname,
      origin: req.headers.get('origin'),
      referer: req.headers.get('referer'),
      host: req.headers.get('host'),
      xForwardedHost: req.headers.get('x-forwarded-host'),
      xForwardedProto: req.headers.get('x-forwarded-proto')
    });
  }

  if (
    pathname.startsWith('/login') ||
    pathname.startsWith('/api/auth') ||
    (isCatalogSyncRoute && hasValidCronSecret(req)) ||
    isAssetPath(pathname)
  ) {
    const response = await next();
    if (isAuthRoute) {
      authDebugLog('Auth route response', {
        method: req.method,
        pathname,
        status: response.status
      });
    }
    return response;
  }

  const sessionData = await auth.api.getSession({
    headers: req.headers
  });

  context.locals.user = sessionData?.user ?? null;
  context.locals.session = sessionData?.session ?? null;
  context.locals.canManageRepositories = canManageRepositories(sessionData?.user?.email);

  const hasAllowedDomain = isAllowedEmailDomain(sessionData?.user?.email);

  if (!sessionData?.session || !sessionData.user || !hasAllowedDomain) {
    if (pathname.startsWith('/api/')) {
      authDebugLog('Blocked API request without session', {
        pathname,
        method: req.method
      });

      const status = sessionData?.session && sessionData.user && !hasAllowedDomain ? 403 : 401;
      const error = status === 403 ? 'ForbiddenDomain' : 'Unauthorized';

      return new Response(JSON.stringify({ error }), {
        status,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    authDebugLog('Redirecting user to login', {
      pathname,
      reason: !sessionData?.session ? 'NoSession' : 'ForbiddenDomain'
    });

    const target = !sessionData?.session ? '/login/' : '/login/?error=AccessDenied';
    return context.redirect(target);
  }

  try {
    await syncUserToCatalog(sessionData.user);
  } catch (error) {
    const message = error instanceof Error ? error.message : 'UnknownError';
    console.warn('[auth-sync] no se pudo registrar usuario en users', {
      userId: sessionData.user.id,
      email: sessionData.user.email,
      message
    });
  }

  return next();
};
