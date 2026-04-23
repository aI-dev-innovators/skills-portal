import type { APIRoute } from 'astro';
import type { AnalyticsEventInput } from '../../../lib/services/types';
import { upsertUser } from '../../../lib/services/users';
import { getRepositoryById } from '../../../lib/services/repositories';
import { upsertSkill } from '../../../lib/services/skills';
import {
  insertLoginEvent,
  insertRepositoryView,
  insertSkillFeedback,
  insertSkillView
} from '../../../lib/services/metrics';

export const prerender = false;

function jsonResponse(body: Record<string, unknown>, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json' }
  });
}

function parseRequestBody(body: unknown): AnalyticsEventInput[] {
  if (!body || typeof body !== 'object') return [];
  const events = (body as { events?: unknown }).events;
  if (!Array.isArray(events)) return [];
  return events as AnalyticsEventInput[];
}

function extractClientIp(request: Request): string | null {
  const forwardedFor = request.headers.get('x-forwarded-for');
  if (forwardedFor) {
    return forwardedFor.split(',')[0]?.trim() || null;
  }

  const realIp = request.headers.get('x-real-ip');
  if (realIp) return realIp;
  return null;
}

function summarizeEvent(event: AnalyticsEventInput): Record<string, unknown> {
  if (event.type === 'login') {
    return { type: event.type, sessionId: event.payload.sessionId, loginStatus: event.payload.loginStatus || 'ok' };
  }

  if (event.type === 'repository_view') {
    return {
      type: event.type,
      repositoryId: event.payload.repositoryId,
      sessionId: event.payload.sessionId,
      sourcePage: event.payload.sourcePage
    };
  }

  if (event.type === 'skill_view') {
    return {
      type: event.type,
      skillId: event.payload.skillId,
      repositoryId: event.payload.repositoryId,
      sessionId: event.payload.sessionId,
      sourcePage: event.payload.sourcePage
    };
  }

  return {
    type: event.type,
    skillId: event.payload.skillId,
    repositoryId: event.payload.repositoryId,
    sessionId: event.payload.sessionId,
    sourcePage: event.payload.sourcePage,
    helpfulVote: event.payload.helpfulVote || null,
    hasSuggestion: Boolean(event.payload.suggestion?.trim())
  };
}

export const POST: APIRoute = async ({ request, locals }) => {
  if (!locals.user || !locals.session) {
    return jsonResponse({ error: 'Unauthorized' }, 401);
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return jsonResponse({ error: 'InvalidJSON' }, 400);
  }

  const events = parseRequestBody(body);
  if (events.length === 0) {
    return jsonResponse({ error: 'EmptyEvents' }, 400);
  }

  const userId = locals.user.id;
  const email = locals.user.email || '';

  if (!email) {
    return jsonResponse({ error: 'InvalidUser' }, 400);
  }

  try {
    const catalogUser = await upsertUser({
      user_id: userId,
      email,
      display_name: locals.user.name || null,
      provider: 'github',
      last_seen_at: new Date().toISOString(),
      is_active: true
    });

    const resolvedUserId = catalogUser.user_id;
    const resolvedEmail = catalogUser.email;

    const ipAddress = extractClientIp(request);
    const userAgent = request.headers.get('user-agent');

    let insertedCount = 0;
    let skippedDuplicates = 0;

    for (const event of events) {
      if (!event?.type || !event.payload) continue;

      if (event.type === 'login') {
        const loginAt = new Date().toISOString();
        await upsertUser({
          user_id: resolvedUserId,
          email: resolvedEmail,
          display_name: locals.user.name || null,
          provider: 'github',
          last_login_at: loginAt,
          last_seen_at: loginAt,
          is_active: true
        });

        await insertLoginEvent({
          user_id: resolvedUserId,
          login_at: loginAt,
          ip_address: ipAddress,
          user_agent: userAgent,
          session_id: event.payload.sessionId,
          login_status: event.payload.loginStatus || 'ok'
        });
        insertedCount += 1;
        continue;
      }

      if (event.type === 'repository_view') {
        const repository = await getRepositoryById(event.payload.repositoryId);

        if (!repository) {
          console.warn('[analytics-ingest] repository_view skipped because repository does not exist', summarizeEvent(event));
          skippedDuplicates += 1;
          continue;
        }

        const result = await insertRepositoryView({
          user_id: resolvedUserId,
          repository_id: event.payload.repositoryId,
          viewed_at: event.payload.viewedAt || new Date().toISOString(),
          duration_seconds: Math.max(0, Math.floor(event.payload.durationSeconds || 0)),
          source_page: event.payload.sourcePage || request.headers.get('referer') || 'unknown',
          session_id: event.payload.sessionId
        });

        if (result.inserted) insertedCount += 1;
        else skippedDuplicates += 1;
        continue;
      }

      if (event.type === 'skill_view') {
        const repository = await getRepositoryById(event.payload.repositoryId);

        if (!repository) {
          console.warn('[analytics-ingest] skill_view skipped because repository does not exist', summarizeEvent(event));
          skippedDuplicates += 1;
          continue;
        }

        await upsertSkill({
          skill_id: event.payload.skillId,
          skill_name: event.payload.skillName || event.payload.skillId,
          category: event.payload.category || null,
          repository_id: event.payload.repositoryId,
          description: event.payload.description || null,
          is_active: true
        });

        const result = await insertSkillView({
          user_id: resolvedUserId,
          skill_id: event.payload.skillId,
          repository_id: event.payload.repositoryId,
          viewed_at: event.payload.viewedAt || new Date().toISOString(),
          duration_seconds: Math.max(0, Math.floor(event.payload.durationSeconds || 0)),
          source_page: event.payload.sourcePage || request.headers.get('referer') || 'unknown',
          session_id: event.payload.sessionId
        });

        if (result.inserted) insertedCount += 1;
        else skippedDuplicates += 1;
        continue;
      }

      if (event.type === 'skill_feedback') {
        const repository = await getRepositoryById(event.payload.repositoryId);

        if (!repository) {
          console.warn('[analytics-ingest] skill_feedback skipped because repository does not exist', summarizeEvent(event));
          skippedDuplicates += 1;
          continue;
        }

        if (!event.payload.skillId) {
          console.warn('[analytics-ingest] skill_feedback skipped because skillId is missing', summarizeEvent(event));
          skippedDuplicates += 1;
          continue;
        }

        await upsertSkill({
          skill_id: event.payload.skillId,
          skill_name: event.payload.skillName || event.payload.skillId,
          category: event.payload.description || null,
          repository_id: event.payload.repositoryId,
          description: event.payload.description || null,
          is_active: true
        });

        const suggestion = event.payload.suggestion?.trim() || null;
        const vote = event.payload.helpfulVote || null;

        if (!vote && !suggestion) {
          console.warn('[analytics-ingest] feedback event without content skipped', summarizeEvent(event));
          skippedDuplicates += 1;
          continue;
        }

        await insertSkillFeedback({
          user_id: resolvedUserId,
          skill_id: event.payload.skillId,
          repository_id: event.payload.repositoryId,
          helpful_vote: vote,
          suggestion,
          source_page: event.payload.sourcePage || request.headers.get('referer') || 'unknown',
          session_id: event.payload.sessionId,
          submitted_at: event.payload.submittedAt || new Date().toISOString()
        });

        insertedCount += 1;
        continue;
      }

      console.warn('[analytics-ingest] unknown event type skipped', summarizeEvent(event));
    }

    return jsonResponse({
      ok: true,
      processed: events.length,
      inserted: insertedCount,
      skippedDuplicates
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'UnknownError';
    console.error('[analytics-ingest] failed', {
      message,
      eventTypes: events.map((event) => event?.type).filter(Boolean),
      userId,
      email,
      ipAddress: extractClientIp(request)
    });
    return jsonResponse({ error: 'IngestFailed', detail: message }, 500);
  }
};
