import type { APIRoute } from 'astro';
import { canManageRepositories } from '../../../lib/auth';
import { invalidateReposConfigCache } from '../../../lib/config';
import { invalidateSkillsCatalogCache } from '../../../lib/skill.service';
import { invalidateAllCatalogCache } from '../../../lib/cache/catalog-cache';

export const prerender = false;

function jsonResponse(body: Record<string, unknown>, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json' }
  });
}

export const POST: APIRoute = async ({ locals }) => {
  if (!locals.user || !locals.session || !canManageRepositories(locals.user.email)) {
    return jsonResponse({ error: 'Forbidden' }, 403);
  }

  invalidateReposConfigCache();
  invalidateSkillsCatalogCache();
  invalidateAllCatalogCache();

  return jsonResponse({ ok: true, message: 'Cache limpiada correctamente' });
};
