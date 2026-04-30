import type { APIRoute } from 'astro';
import { invalidateReposConfigCache } from '../../../lib/config';
import { canManageRepositories } from '../../../lib/auth';
import { deleteRepository, upsertRepository } from '../../../lib/services/repositories';
import { invalidateSkillsCatalogCache } from '../../../lib/skill.service';
import { invalidateCatalogByPrefix } from '../../../lib/cache/catalog-cache';

export const prerender = false;

function jsonResponse(body: Record<string, unknown>, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json' }
  });
}

function parseTags(value: unknown): string[] {
  if (typeof value !== 'string') return [];
  return Array.from(new Set(value.split(',').map((tag) => tag.trim()).filter(Boolean)));
}

function parseBoolean(value: unknown, fallback = true): boolean {
  if (typeof value === 'boolean') return value;
  if (typeof value === 'string') {
    const normalized = value.trim().toLowerCase();
    if (['true', '1', 'yes', 'on'].includes(normalized)) return true;
    if (['false', '0', 'no', 'off'].includes(normalized)) return false;
  }
  return fallback;
}

export const POST: APIRoute = async ({ request, locals }) => {
  if (!locals.user || !locals.session || !canManageRepositories(locals.user.email)) {
    return jsonResponse({ error: 'Forbidden' }, 403);
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return jsonResponse({ error: 'InvalidJSON' }, 400);
  }

  if (!body || typeof body !== 'object') {
    return jsonResponse({ error: 'InvalidPayload' }, 400);
  }

  const action = String((body as { action?: unknown }).action || '').trim().toLowerCase();
  if (!['create', 'edit', 'delete'].includes(action)) {
    return jsonResponse({ error: 'InvalidAction' }, 400);
  }

  try {
    if (action === 'delete') {
      const repositoryId = String((body as { repository_id?: unknown }).repository_id || '').trim();
      if (!repositoryId) {
        return jsonResponse({ error: 'MissingRepositoryId' }, 400);
      }

      await deleteRepository(repositoryId);
      invalidateReposConfigCache();
      invalidateSkillsCatalogCache(repositoryId);
      invalidateCatalogByPrefix('repositories:');
      invalidateCatalogByPrefix('skills:');
      return jsonResponse({ ok: true });
    }

    const originalRepositoryId = String((body as { original_repository_id?: unknown }).original_repository_id || '').trim();
    const repositoryId = String((body as { repository_id?: unknown }).repository_id || '').trim();
    const repositoryName = String((body as { repository_name?: unknown }).repository_name || '').trim();
    const fullName = String((body as { full_name?: unknown }).full_name || '').trim();
    const githubUrl = String((body as { github_url?: unknown }).github_url || '').trim();
    const description = String((body as { description?: unknown }).description || '').trim();
    const tags = parseTags((body as { tags?: unknown }).tags);
    const isActive = parseBoolean((body as { is_active?: unknown }).is_active, true);

    if (!repositoryId || !repositoryName || !fullName || !githubUrl) {
      return jsonResponse({ error: 'MissingFields' }, 400);
    }

    if (action === 'edit' && originalRepositoryId && originalRepositoryId !== repositoryId) {
      await deleteRepository(originalRepositoryId);
    }

    const saved = await upsertRepository({
      repository_id: repositoryId,
      repository_name: repositoryName,
      full_name: fullName,
      github_url: githubUrl,
      description: description || null,
      is_active: isActive,
      tags
    });

    invalidateReposConfigCache();
    invalidateSkillsCatalogCache();
    invalidateCatalogByPrefix('repositories:');
    invalidateCatalogByPrefix('skills:');
    return jsonResponse({ ok: true, repository: saved });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'UnexpectedError';
    return jsonResponse({ error: message }, 500);
  }
};
