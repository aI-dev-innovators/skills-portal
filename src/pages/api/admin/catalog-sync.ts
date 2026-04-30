import type { APIRoute } from 'astro';
import { readReposConfig } from '../../../lib/config';
import { collectSkillsFromRemote, invalidateSkillsCatalogCache } from '../../../lib/skill.service';

export const prerender = false;

function jsonResponse(body: Record<string, unknown>, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json' }
  });
}

function hasValidSyncSecret(request: Request): boolean {
  const expected = process.env.CATALOG_SYNC_SECRET || process.env.CRON_SECRET;
  if (!expected) return false;

  const header = request.headers.get('x-catalog-sync-secret') || request.headers.get('authorization') || '';
  const token = header.startsWith('Bearer ') ? header.slice('Bearer '.length).trim() : header.trim();
  return token.length > 0 && token === expected;
}

async function mapLimit<T, R>(items: T[], limit: number, fn: (item: T) => Promise<R>): Promise<R[]> {
  if (limit < 1) return Promise.all(items.map(fn));

  const results: R[] = [];
  let index = 0;

  const workers = Array(Math.min(limit, items.length))
    .fill(0)
    .map(async () => {
      while (index < items.length) {
        const current = index;
        index += 1;
        results[current] = await fn(items[current]);
      }
    });

  await Promise.all(workers);
  return results;
}

export const GET: APIRoute = async ({ request, locals }) => {
  const canRunBySecret = hasValidSyncSecret(request);
  const canRunByUser = Boolean(locals.canManageRepositories && locals.user);

  if (!canRunBySecret && !canRunByUser) {
    return jsonResponse({ error: 'Unauthorized' }, 401);
  }

  const startedAt = Date.now();

  try {
    const repos = await readReposConfig();
    const perRepo = await mapLimit(repos, 3, async (repo) => {
      try {
        const skills = await collectSkillsFromRemote(repo, { refresh: true });
        return {
          repoId: repo.id,
          ok: true,
          skills: skills.length
        };
      } catch (error) {
        const message = error instanceof Error ? error.message : 'UnknownError';
        return {
          repoId: repo.id,
          ok: false,
          skills: 0,
          error: message
        };
      }
    });

    const totalSkills = perRepo.reduce((acc, item) => acc + item.skills, 0);
    const failed = perRepo.filter((item) => !item.ok);
    invalidateSkillsCatalogCache();

    return jsonResponse({
      ok: failed.length === 0,
      reposProcessed: perRepo.length,
      reposFailed: failed.length,
      totalSkills,
      durationMs: Date.now() - startedAt,
      repos: perRepo
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'UnknownError';
    return jsonResponse(
      {
        ok: false,
        error: 'CatalogSyncFailed',
        detail: message,
        durationMs: Date.now() - startedAt
      },
      500
    );
  }
};
