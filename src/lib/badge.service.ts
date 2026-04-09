/**
 * Badge Service
 * 
 * Generates automatic badges for skills based on metadata, assets, and activity.
 * Badges communicate quality signals, maturity, and availability of resources.
 */

export type BadgeType = 
  | 'examples-included' 
  | 'evals-included'
  | 'enterprise-ready'
  | 'recently-updated'
  | 'recommended'
  | 'beginner-friendly'
  | 'top-skill';

export interface SkillBadge {
  type: BadgeType;
  label: string;
  icon: string;
  color: 'green' | 'blue' | 'purple' | 'amber' | 'pink';
  tooltip?: string;
}

/**
 * Badge definitions
 */
const BADGE_DEFINITIONS: Record<BadgeType, SkillBadge> = {
  'examples-included': {
    type: 'examples-included',
    label: 'Ejemplos',
    icon: '📚',
    color: 'blue',
    tooltip: 'Incluye ejemplos de código ejecutables'
  },
  'evals-included': {
    type: 'evals-included',
    label: 'Evaluaciones',
    icon: '✓',
    color: 'green',
    tooltip: 'Incluye casos de evaluación'
  },
  'enterprise-ready': {
    type: 'enterprise-ready',
    label: 'Enterprise Ready',
    icon: '⚙️',
    color: 'purple',
    tooltip: 'Ejemplos, evaluaciones, templates, scripts y estable'
  },
  'recently-updated': {
    type: 'recently-updated',
    label: 'Actualizado',
    icon: '🔄',
    color: 'amber',
    tooltip: 'Actualizado en los últimos 30 días'
  },
  'recommended': {
    type: 'recommended',
    label: 'Recomendado',
    icon: '⭐',
    color: 'pink',
    tooltip: 'Recomendado por el equipo'
  },
  'beginner-friendly': {
    type: 'beginner-friendly',
    label: 'Principiantes',
    icon: '🌱',
    color: 'green',
    tooltip: 'Ideal para principiantes'
  },
  'top-skill': {
    type: 'top-skill',
    label: 'Top Skill',
    icon: '🏆',
    color: 'amber',
    tooltip: 'Entre los skills más populares'
  }
};

/**
 * Evaluate if a skill should have the 'examples-included' badge
 */
function hasExamplesBadge(skill: { hasExamples?: boolean }): boolean {
  return skill.hasExamples === true;
}

/**
 * Evaluate if a skill should have the 'evals-included' badge
 */
function hasEvalsBadge(skill: { hasEvals?: boolean }): boolean {
  return skill.hasEvals === true;
}

/**
 * Evaluate if a skill should have the 'enterprise-ready' badge
 * Requirements: examples, evals, templates, scripts, and stable status
 */
function hasEnterpriseReadyBadge(skill: {
  hasExamples?: boolean;
  hasEvals?: boolean;
  hasTemplates?: boolean;
  hasScripts?: boolean;
  status?: string;
}): boolean {
  return !!(
    skill.hasExamples &&
    skill.hasEvals &&
    skill.hasTemplates &&
    skill.hasScripts &&
    skill.status === 'stable'
  );
}

/**
 * Evaluate if a skill should have the 'recently-updated' badge
 * Last updated within 30 days
 */
function hasRecentlyUpdatedBadge(skill: { lastUpdated?: string | null }): boolean {
  if (!skill.lastUpdated) return false;
  const lastUpdate = new Date(skill.lastUpdated);
  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
  return lastUpdate > thirtyDaysAgo;
}

/**
 * Evaluate if a skill should have the 'recommended' badge
 * Status is marked as 'recommended'
 */
function hasRecommendedBadge(skill: { status?: string }): boolean {
  return skill.status === 'recommended';
}

/**
 * Evaluate if a skill should have the 'beginner-friendly' badge
 * Level is 'beginner'
 */
function hasBeginnerFriendlyBadge(skill: { level?: string }): boolean {
  return skill.level === 'beginner';
}

/**
 * Evaluate if a skill should have the 'top-skill' badge
 * Score is in top percentile (this would need telemetry in Fase 4)
 * For now, we consider skills with high repo stars and enterprise-ready
 */
function hasTopSkillBadge(skill: {
  hasExamples?: boolean;
  hasEvals?: boolean;
  hasTemplates?: boolean;
  hasScripts?: boolean;
  status?: string;
  repoStars?: number;
}): boolean {
  const isEnterpriseReady = hasEnterpriseReadyBadge(skill);
  const hasHighStars = (skill.repoStars || 0) >= 50;
  return isEnterpriseReady && hasHighStars;
}

/**
 * Generate all applicable badges for a skill
 */
export function generateBadges(skill: any): SkillBadge[] {
  const badges: SkillBadge[] = [];

  if (hasExamplesBadge(skill)) {
    badges.push(BADGE_DEFINITIONS['examples-included']);
  }

  if (hasEvalsBadge(skill)) {
    badges.push(BADGE_DEFINITIONS['evals-included']);
  }

  if (hasEnterpriseReadyBadge(skill)) {
    badges.push(BADGE_DEFINITIONS['enterprise-ready']);
  }

  if (hasRecentlyUpdatedBadge(skill)) {
    badges.push(BADGE_DEFINITIONS['recently-updated']);
  }

  if (hasRecommendedBadge(skill)) {
    badges.push(BADGE_DEFINITIONS['recommended']);
  }

  if (hasBeginnerFriendlyBadge(skill)) {
    badges.push(BADGE_DEFINITIONS['beginner-friendly']);
  }

  if (hasTopSkillBadge(skill)) {
    badges.push(BADGE_DEFINITIONS['top-skill']);
  }

  return badges;
}

/**
 * Get a single badge definition
 */
export function getBadgeDefinition(type: BadgeType): SkillBadge {
  return BADGE_DEFINITIONS[type];
}

/**
 * Get all badge definitions
 */
export function getAllBadgeDefinitions(): Record<BadgeType, SkillBadge> {
  return BADGE_DEFINITIONS;
}
