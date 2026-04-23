import type { AnalyticsEventInput } from '../services/types';

const FLUSH_INTERVAL_MS = 25_000;
const MAX_BUFFER_SIZE = 50;
const DUPLICATE_WINDOW_MS = 30_000;
const STORAGE_KEY = 'skills-portal.metrics.buffer.v1';

let initialized = false;
let flushTimer: number | null = null;
let sessionId = '';
let queue: AnalyticsEventInput[] = [];
const lastEventAt = new Map<string, number>();

function isBrowser(): boolean {
  return typeof window !== 'undefined';
}

function getSessionId(): string {
  if (!isBrowser()) return 'server-session';
  if (sessionId) return sessionId;

  const storageKey = 'skills-portal.metrics.session-id';
  try {
    const stored = sessionStorage.getItem(storageKey);
    if (stored) {
      sessionId = stored;
      return sessionId;
    }

    sessionId = `${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
    sessionStorage.setItem(storageKey, sessionId);
    return sessionId;
  } catch {
    sessionId = `${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
    return sessionId;
  }
}

function readPersistedQueue(): AnalyticsEventInput[] {
  if (!isBrowser()) return [];

  try {
    const raw = sessionStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as unknown;
    return Array.isArray(parsed) ? (parsed as AnalyticsEventInput[]) : [];
  } catch {
    return [];
  }
}

function persistQueue(): void {
  if (!isBrowser()) return;

  try {
    if (queue.length === 0) {
      sessionStorage.removeItem(STORAGE_KEY);
      return;
    }

    sessionStorage.setItem(STORAGE_KEY, JSON.stringify(queue));
  } catch {
    // Ignore storage quota or privacy mode restrictions.
  }
}

function clearPersistedQueue(): void {
  if (!isBrowser()) return;

  try {
    sessionStorage.removeItem(STORAGE_KEY);
  } catch {
    // Ignore storage failures.
  }
}

function eventKey(event: AnalyticsEventInput): string {
  if (event.type === 'skill_view') {
    return `${event.type}:${event.payload.skillId}:${event.payload.repositoryId}`;
  }

  if (event.type === 'repository_view') {
    return `${event.type}:${event.payload.repositoryId}`;
  }

  if (event.type === 'skill_feedback') {
    const suggestion = event.payload.suggestion?.trim().slice(0, 64) || 'no-suggestion';
    const vote = event.payload.helpfulVote || 'no-vote';
    return `${event.type}:${event.payload.skillId}:${vote}:${suggestion}`;
  }

  return `${event.type}:${event.payload.sessionId}`;
}

function shouldSkipDuplicate(event: AnalyticsEventInput): boolean {
  if (event.type === 'login') return false;

  const key = eventKey(event);
  const previousAt = lastEventAt.get(key);
  const now = Date.now();

  if (previousAt && now - previousAt < DUPLICATE_WINDOW_MS) {
    return true;
  }

  lastEventAt.set(key, now);
  return false;
}

async function postEvents(batch: AnalyticsEventInput[]): Promise<void> {
  if (!batch.length) return;

  const response = await fetch('/api/analytics/ingest', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ events: batch }),
    credentials: 'same-origin',
    keepalive: true
  });

  if (!response.ok) {
    const detail = await response.text().catch(() => '');
    throw new Error(`Analytics ingest failed: ${response.status} ${response.statusText}${detail ? ` - ${detail}` : ''}`);
  }
}

export async function flushMetricsBuffer(): Promise<void> {
  if (!isBrowser()) return;
  if (!queue.length) return;

  const batch = queue;
  queue = [];

  try {
    await postEvents(batch);
    clearPersistedQueue();
  } catch {
    queue = [...batch, ...queue].slice(0, MAX_BUFFER_SIZE);
    persistQueue();
  }
}

function startFlushTimer(): void {
  if (flushTimer !== null) return;
  flushTimer = window.setInterval(() => {
    void flushMetricsBuffer();
  }, FLUSH_INTERVAL_MS);
}

export function initializeMetricsBuffer(): void {
  if (!isBrowser() || initialized) return;
  initialized = true;
  queue = [...readPersistedQueue(), ...queue].slice(0, MAX_BUFFER_SIZE);
  getSessionId();
  startFlushTimer();

  window.addEventListener('pagehide', () => {
    persistQueue();
  });

  window.addEventListener('beforeunload', () => {
    persistQueue();
  });

  document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'hidden') {
      persistQueue();
    }
  });
}

export function getMetricsSessionId(): string {
  return getSessionId();
}

export function enqueueMetricEvent(event: AnalyticsEventInput): void {
  if (!isBrowser()) return;

  initializeMetricsBuffer();

  if (shouldSkipDuplicate(event)) {
    return;
  }

  queue.push(event);
  persistQueue();
  if (queue.length >= MAX_BUFFER_SIZE) {
    void flushMetricsBuffer();
  }
}

export function getBufferedMetricCount(): number {
  return queue.length;
}
