import type { MiddlewareHandler } from 'astro';
import { auth, isAllowedEmailDomain } from './lib/auth';

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

  const sessionData = await auth.api.getSession({
    headers: req.headers
  });

  context.locals.user = sessionData?.user ?? null;
  context.locals.session = sessionData?.session ?? null;

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

  return next();
};
