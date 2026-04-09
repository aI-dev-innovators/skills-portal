/**
 * Ranking Service
 * 
 * Calculates skill scores and rankings based on metadata, metrics, and activity.
 * Score formula:
 * score = 0.30 * repoStars + 0.20 * recentActivity + 0.20 * completeness + 0.20 * skillViews + 0.10 * helpfulVotes
 */

export interface SkillScore {
  skillId: string;
  skillTitle: string;
  score: number;
  components: {
    repoStars: number;
    recentActivity: number;
    completeness: number;
    skillViews: number;
    helpfulVotes: number;
  };
}

/**
 * Normalize a value to 0-1 scale
 */
function normalize(value: number, max: number): number {
  if (max === 0) return 0;
  return Math.min(Math.max(value / max, 0), 1);
}

/**
 * Calculate recent activity score (0-1)
 * Skills updated recently get higher scores
 */
function calculateRecentActivityScore(lastUpdated: string | null | undefined): number {
  if (!lastUpdated) return 0;
  
  try {
    const lastUpdate = new Date(lastUpdated);
    const now = new Date();
    const daysSinceUpdate = (now.getTime() - lastUpdate.getTime()) / (1000 * 60 * 60 * 24);
    
    // Linear decay: 1.0 at 0 days, 0.0 at 90 days
    return Math.max(1 - (daysSinceUpdate / 90), 0);
  } catch {
    return 0;
  }
}

/**
 * Calculate completeness score (0-1)
 * Based on asset availability: examples, evals, templates, scripts
 */
function calculateCompletenessScore(skill: {
  hasExamples?: boolean;
  hasEvals?: boolean;
  hasTemplates?: boolean;
  hasScripts?: boolean;
}): number {
  const assets = [
    skill.hasExamples,
    skill.hasEvals,
    skill.hasTemplates,
    skill.hasScripts
  ];
  
  const present = assets.filter(Boolean).length;
  return normalize(present, assets.length);
}

/**
 * Calculate skill views score (0-1)
 * Placeholder for telemetry in Fase 4
 */
function calculateSkillViewsScore(views?: number): number {
  if (!views) return 0;
  // Normalize with a reasonable max (e.g., 1000 views per skill)
  return normalize(views, 1000);
}

/**
 * Calculate helpful votes score (0-1)
 * Placeholder for telemetry in Fase 4
 */
function calculateHelpfulVotesScore(votes?: number): number {
  if (!votes) return 0;
  // Normalize with a reasonable max (e.g., 100 votes per skill)
  return normalize(votes, 100);
}

/**
 * Normalize repo stars to 0-1 scale
 * Max reference: 500 stars (highly popular)
 */
function calculateRepoStarsScore(stars: number): number {
  return normalize(stars, 300);
}

/**
 * Calculate overall skill score
 */
export function calculateSkillScore(skill: any): SkillScore {
  const repoStars = skill.repoStars || 0;
  const recentActivity = calculateRecentActivityScore(skill.lastUpdated);
  const completeness = calculateCompletenessScore(skill);
  const skillViews = calculateSkillViewsScore(skill.viewCount);
  const helpfulVotes = calculateHelpfulVotesScore(skill.helpfulCount);
  
  // Normalize stars
  const starScore = calculateRepoStarsScore(repoStars);
  
  // Apply weights
  const score = 
    0.30 * starScore +
    0.20 * recentActivity +
    0.20 * completeness +
    0.20 * skillViews +
    0.10 * helpfulVotes;

  return {
    skillId: skill.slug || skill.id || '',
    skillTitle: skill.title || '',
    score: Math.round(score * 1000) / 1000, // 3 decimals
    components: {
      repoStars: Math.round(starScore * 1000) / 1000,
      recentActivity: Math.round(recentActivity * 1000) / 1000,
      completeness: Math.round(completeness * 1000) / 1000,
      skillViews: Math.round(skillViews * 1000) / 1000,
      helpfulVotes: Math.round(helpfulVotes * 1000) / 1000
    }
  };
}

/**
 * Calculate scores for multiple skills and return sorted ranking
 */
export function rankSkills(skills: any[]): SkillScore[] {
  return skills
    .map(calculateSkillScore)
    .sort((a, b) => b.score - a.score);
}

/**
 * Get top N skills
 */
export function getTopSkills(skills: any[], count: number = 10): SkillScore[] {
  return rankSkills(skills).slice(0, count);
}

/**
 * Get percentile rank for a skill (0-100)
 */
export function getPercentileRank(skills: any[], skillId: string): number {
  const ranked = rankSkills(skills);
  const index = ranked.findIndex(s => s.skillId === skillId);
  
  if (index === -1) return 0;
  return Math.round(((ranked.length - index) / ranked.length) * 100);
}
