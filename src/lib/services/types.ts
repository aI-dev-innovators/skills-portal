export type UserRecord = {
  user_id: string;
  email: string;
  display_name: string | null;
  provider: string | null;
  created_at?: string;
  last_login_at?: string | null;
  last_seen_at?: string | null;
  is_active?: boolean;
};

export type RepositoryRecord = {
  repository_id: string;
  repository_name: string;
  full_name: string;
  github_url: string;
  description: string | null;
  is_active?: boolean;
  created_at?: string;
};

export type SkillRecord = {
  skill_id: string;
  skill_name: string;
  category: string | null;
  repository_id: string;
  description: string | null;
  is_active?: boolean;
  created_at?: string;
};

export type LoginEventRecord = {
  login_event_id?: string;
  user_id: string;
  login_at: string;
  ip_address: string | null;
  user_agent: string | null;
  session_id: string;
  login_status: 'ok' | 'failed';
};

export type SkillViewEventRecord = {
  skill_view_id?: string;
  user_id: string;
  skill_id: string;
  repository_id: string;
  viewed_at: string;
  duration_seconds: number;
  source_page: string;
  session_id: string;
};

export type RepositoryViewEventRecord = {
  repository_view_id?: string;
  user_id: string;
  repository_id: string;
  viewed_at: string;
  duration_seconds: number;
  source_page: string;
  session_id: string;
};

export type SkillFeedbackRecord = {
  skill_feedback_id?: string;
  user_id: string;
  skill_id: string;
  repository_id: string;
  helpful_vote: 'helpful' | 'not-helpful' | null;
  suggestion: string | null;
  source_page: string;
  session_id: string;
  submitted_at?: string;
};

export type AnalyticsEventInput =
  | {
      type: 'login';
      payload: {
        sessionId: string;
        loginStatus?: 'ok' | 'failed';
      };
    }
  | {
      type: 'repository_view';
      payload: {
        repositoryId: string;
        repositoryName?: string;
        fullName?: string;
        githubUrl?: string;
        description?: string;
        durationSeconds?: number;
        sourcePage?: string;
        viewedAt?: string;
        sessionId: string;
      };
    }
  | {
      type: 'skill_view';
      payload: {
        skillId: string;
        skillName?: string;
        category?: string;
        description?: string;
        repositoryId: string;
        repositoryName?: string;
        fullName?: string;
        githubUrl?: string;
        durationSeconds?: number;
        sourcePage?: string;
        viewedAt?: string;
        sessionId: string;
      };
    }
  | {
      type: 'skill_feedback';
      payload: {
        skillId: string;
        skillName?: string;
        repositoryId: string;
        repositoryName?: string;
        fullName?: string;
        githubUrl?: string;
        description?: string;
        helpfulVote?: 'helpful' | 'not-helpful';
        suggestion?: string;
        sourcePage?: string;
        submittedAt?: string;
        sessionId: string;
      };
    };
