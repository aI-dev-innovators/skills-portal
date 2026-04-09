export type TelemetrySkillProfile = {
  id: string;
  title: string;
  url: string;
  description?: string;
  repoName?: string;
  frameworks?: string[];
  testTypes?: string[];
  tags?: string[];
  score?: number;
};

type SkillViewEntry = {
  count: number;
  lastViewedAt: string;
  profile: TelemetrySkillProfile;
};

type HelpfulVoteEntry = {
  helpful: number;
  notHelpful: number;
  userVote: 'helpful' | 'not-helpful' | null;
};

type SearchEntry = {
  term: string;
  count: number;
  lastSearchedAt: string;
};

type LinkClickEntry = {
  href: string;
  count: number;
  lastClickedAt: string;
};

type TelemetryStore = {
  skillViews: Record<string, SkillViewEntry>;
  helpfulVotes: Record<string, HelpfulVoteEntry>;
  searches: Record<string, SearchEntry>;
  clicks: Record<string, LinkClickEntry>;
};

const STORAGE_KEY = 'skills-portal.telemetry.v1';
const MAX_SEARCH_ENTRIES = 25;
const MAX_CLICK_ENTRIES = 50;

const DEFAULT_STORE: TelemetryStore = {
  skillViews: {},
  helpfulVotes: {},
  searches: {},
  clicks: {}
};

function isBrowser(): boolean {
  return typeof window !== 'undefined' && typeof localStorage !== 'undefined';
}

function readStore(): TelemetryStore {
  if (!isBrowser()) return DEFAULT_STORE;

  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return DEFAULT_STORE;
    const parsed = JSON.parse(raw) as Partial<TelemetryStore>;

    return {
      skillViews: parsed.skillViews || {},
      helpfulVotes: parsed.helpfulVotes || {},
      searches: parsed.searches || {},
      clicks: parsed.clicks || {}
    };
  } catch {
    return DEFAULT_STORE;
  }
}

function writeStore(store: TelemetryStore): void {
  if (!isBrowser()) return;

  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(store));
  } catch {
    // Ignorar errores de cuota o almacenamiento bloqueado.
  }
}

function pruneEntries<T extends { lastSearchedAt?: string; lastClickedAt?: string }>(entries: Record<string, T>, max: number): Record<string, T> {
  const sorted = Object.entries(entries).sort(([, left], [, right]) => {
    const leftDate = left.lastSearchedAt || left.lastClickedAt || '';
    const rightDate = right.lastSearchedAt || right.lastClickedAt || '';
    return rightDate.localeCompare(leftDate);
  });

  return Object.fromEntries(sorted.slice(0, max));
}

export function trackSkillView(profile: TelemetrySkillProfile): SkillViewEntry | null {
  const store = readStore();
  const existing = store.skillViews[profile.id];

  store.skillViews[profile.id] = {
    count: (existing?.count || 0) + 1,
    lastViewedAt: new Date().toISOString(),
    profile
  };

  writeStore(store);
  return store.skillViews[profile.id];
}

export function getSkillViewStats(skillId: string): SkillViewEntry | null {
  const store = readStore();
  return store.skillViews[skillId] || null;
}

export function trackHelpfulVote(skillId: string, vote: 'helpful' | 'not-helpful'): HelpfulVoteEntry {
  const store = readStore();
  const current = store.helpfulVotes[skillId] || { helpful: 0, notHelpful: 0, userVote: null };

  if (current.userVote === vote) {
    return current;
  }

  if (current.userVote === 'helpful' && current.helpful > 0) current.helpful -= 1;
  if (current.userVote === 'not-helpful' && current.notHelpful > 0) current.notHelpful -= 1;

  if (vote === 'helpful') current.helpful += 1;
  if (vote === 'not-helpful') current.notHelpful += 1;
  current.userVote = vote;

  store.helpfulVotes[skillId] = current;
  writeStore(store);
  return current;
}

export function getHelpfulVoteStats(skillId: string): HelpfulVoteEntry {
  const store = readStore();
  return store.helpfulVotes[skillId] || { helpful: 0, notHelpful: 0, userVote: null };
}

export function trackSearchQuery(term: string): SearchEntry | null {
  const normalized = term.trim().toLowerCase();
  if (normalized.length < 2) return null;

  const store = readStore();
  const current = store.searches[normalized];
  store.searches[normalized] = {
    term: normalized,
    count: (current?.count || 0) + 1,
    lastSearchedAt: new Date().toISOString()
  };

  store.searches = pruneEntries(store.searches, MAX_SEARCH_ENTRIES);
  writeStore(store);
  return store.searches[normalized];
}

export function getRecentSearches(limit = 6): SearchEntry[] {
  const store = readStore();
  return Object.values(store.searches)
    .sort((left, right) => right.lastSearchedAt.localeCompare(left.lastSearchedAt))
    .slice(0, limit);
}

export function trackLinkClick(href: string): LinkClickEntry | null {
  const normalized = href.trim();
  if (!normalized) return null;

  const store = readStore();
  const current = store.clicks[normalized];
  store.clicks[normalized] = {
    href: normalized,
    count: (current?.count || 0) + 1,
    lastClickedAt: new Date().toISOString()
  };

  store.clicks = pruneEntries(store.clicks, MAX_CLICK_ENTRIES);
  writeStore(store);
  return store.clicks[normalized];
}

export function getTopViewedSkills(limit = 5): SkillViewEntry[] {
  const store = readStore();
  return Object.values(store.skillViews)
    .sort((left, right) => {
      if (right.count !== left.count) return right.count - left.count;
      return right.lastViewedAt.localeCompare(left.lastViewedAt);
    })
    .slice(0, limit);
}

function overlapScore(base: string[] = [], candidate: string[] = []): number {
  if (base.length === 0 || candidate.length === 0) return 0;
  const baseSet = new Set(base.map((item) => item.toLowerCase()));
  return candidate.reduce((acc, item) => acc + (baseSet.has(item.toLowerCase()) ? 1 : 0), 0);
}

export function getRecommendedSkills(
  catalog: TelemetrySkillProfile[],
  currentSkillId?: string,
  limit = 4
): TelemetrySkillProfile[] {
  const recentProfiles = getTopViewedSkills(8).map((entry) => entry.profile);
  if (recentProfiles.length === 0) {
    return catalog
      .filter((skill) => skill.id !== currentSkillId)
      .sort((left, right) => (right.score || 0) - (left.score || 0))
      .slice(0, limit);
  }

  const preferences = recentProfiles.reduce(
    (acc, profile) => {
      acc.frameworks.push(...(profile.frameworks || []));
      acc.testTypes.push(...(profile.testTypes || []));
      acc.tags.push(...(profile.tags || []));
      return acc;
    },
    { frameworks: [] as string[], testTypes: [] as string[], tags: [] as string[] }
  );

  return catalog
    .filter((skill) => skill.id !== currentSkillId)
    .map((skill) => {
      const score =
        overlapScore(preferences.frameworks, skill.frameworks || []) * 3 +
        overlapScore(preferences.testTypes, skill.testTypes || []) * 2 +
        overlapScore(preferences.tags, skill.tags || []) +
        (skill.score || 0);

      return { skill, weight: score };
    })
    .sort((left, right) => right.weight - left.weight)
    .slice(0, limit)
    .map((entry) => entry.skill);
}