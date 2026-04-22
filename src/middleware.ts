import type { MiddlewareHandler } from 'astro';
import { getSession } from 'auth-astro/server';

function isAssetPath(pathname: string): boolean {
  return /\.[a-zA-Z0-9]+$/.test(pathname) || pathname.startsWith('/_astro/');
}

export const onRequest: MiddlewareHandler = async (context, next) => {
  const { pathname } = context.url;

  // GitHub/Auth.js puede volver al callback sin slash final.
  // Con trailingSlash=always Astro devuelve 404, por eso normalizamos aqui.
  if (/^\/api\/auth\/callback\/[^/]+$/.test(pathname)) {
    const normalized = new URL(context.request.url);
    normalized.pathname = `${pathname}/`;
    return context.redirect(normalized.toString(), 308);
  }

  if (
    pathname.startsWith('/login') ||
    pathname.startsWith('/api/auth') ||
    isAssetPath(pathname)
  ) {
    return next();
  }

  const session = await getSession(context.request);

  if (!session?.user) {
    if (pathname.startsWith('/api/')) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    return context.redirect('/login/');
  }

  return next();
};
