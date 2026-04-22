import type { MiddlewareHandler } from 'astro';
import { getSession } from 'auth-astro/server';

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

export const onRequest: MiddlewareHandler = async (context, next) => {
  const { pathname } = context.url;
  const req = context.request;
  const isAuthRoute = pathname.startsWith('/api/auth');

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

  // GitHub/Auth.js puede volver al callback sin slash final.
  // Con trailingSlash=always Astro devuelve 404, por eso normalizamos aqui.
  if (/^\/api\/auth\/callback\/[^/]+$/.test(pathname)) {
    const normalized = new URL(context.request.url);
    normalized.pathname = `${pathname}/`;
    authDebugLog('Redirecting callback route to trailing slash', {
      from: pathname,
      to: normalized.pathname
    });
    return context.redirect(normalized.toString(), 308);
  }

  if (
    pathname.startsWith('/login') ||
    pathname.startsWith('/api/auth') ||
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

  const session = await getSession(context.request);

  if (!session?.user) {
    if (pathname.startsWith('/api/')) {
      authDebugLog('Blocked API request without session', {
        pathname,
        method: req.method
      });
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    authDebugLog('Redirecting anonymous user to login', { pathname });
    return context.redirect('/login/');
  }

  return next();
};
