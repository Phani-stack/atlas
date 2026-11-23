export type Resource = {
  id: number;
  title: string;
  url: string;
  type: string;
  source: string;
  domain: string;
  relevance_score: number | null;
  summary: string;
  difficulty: string;
  topics: string[];
  stage: string | null;
  estimated_minutes: number | null;
  channel: string | null;
  duration_min: number | null;
  pages: number | null;
  downloaded: boolean;
  local_path: string | null;
};

export type ResourceCollection = {
  topic: string;
  learner: {
    known: string;
    goal: string;
    level: string;
  };
  generated_at: string;
  stats: {
    total: number;
    downloaded: number;
    by_type: Record<string, number>;
    by_difficulty: Record<string, number>;
    by_stage: Record<string, number>;
  };
  roadmap_context: {
    brief: string;
    coverage_gaps: string[];
  };
  resources: Resource[];
};

export type RoadmapResource = Pick<
  Resource,
  "id" | "title" | "url" | "type" | "difficulty" | "estimated_minutes" | "downloaded"
> & { why?: string };

export type RoadmapModule = {
  module_id: string;
  title: string;
  objectives: string[];
  concepts: string[];
  resources: {
    primary: RoadmapResource[];
    supplementary: RoadmapResource[];
  };
  practice: string[];
  checkpoint: string;
  estimated_hours: number;
  needs_external_resources: boolean;
};

export type RoadmapPhase = {
  phase: number;
  title: string;
  objective: string;
  stage: string | null;
  estimated_hours: number;
  modules: RoadmapModule[];
};

export type Roadmap = {
  topic: string;
  learner: ResourceCollection["learner"];
  generated_at: string;
  mode: string;
  overview: string;
  total_estimated_hours: number;
  assumed_hours_per_week: number;
  estimated_weeks: number;
  schedule: { phase: number; title: string; weeks: string }[];
  phases: RoadmapPhase[];
  capstone_project: {
    title: string;
    description: string;
    skills_used: string[];
  } | null;
  gaps_to_fill: { topic: string; why: string; search_queries: string[] }[];
};

export type LearningResponse = {
  resources: ResourceCollection;
  roadmap: Roadmap;
};

export type LearnRequest = {
  name?: string;
  topic: string;
  known: string;
  goal: string;
  hours_per_week: number;
};

export type AuthUser = {
  id: string;
  email: string;
};

export type AuthResponse = {
  access_token: string;
  token_type: "bearer";
  expires_in: number;
  user: AuthUser;
};

export type SpaceSummary = {
  id: string;
  name: string;
  topic: string;
  status: "building" | "ready" | "failed";
  error_message?: string | null;
  created_at: string;
  updated_at: string;
};

export type LearningSpace = SpaceSummary & {
  known: string;
  goal: string;
  hours_per_week: number;
  resources: ResourceCollection | null;
  roadmap: Roadmap | null;
};

export type TutorModuleProgress = {
  module_id: string;
  title: string;
  phase: string;
  status: "done" | "active" | "locked";
  mastery: number;
  asked: number;
  gaps: boolean;
  weak: string[];
};

export type TutorHistoryEntry = {
  id: string;
  number: number;
  module_id: string;
  concept: string;
  type: "mcq" | "short" | "problem" | "code";
  question: string;
  answer: string;
  score: number;
  verdict: string;
  timestamp: string;
  difficulty: number;
  hints: number;
  review: boolean;
};

export type TutorStatus = {
  topic: string;
  difficulty: number;
  stats: {
    streak: number;
    best_streak: number;
    xp: number;
    answered: number;
  };
  modules: TutorModuleProgress[];
  history: TutorHistoryEntry[];
  done: number;
  total: number;
};

export type TutorQuestion = {
  id: string;
  module_id: string;
  module_title: string;
  concept: string;
  type: "mcq" | "short" | "problem" | "code";
  difficulty: number;
  review: boolean;
  title: string;
  prompt: string;
  sources: { title: string; where: string; url: string; resource_id: number }[];
  hints_available: number;
  options?: string[];
  code?: {
    fn: string;
    starter: string;
    examples: { args: unknown[]; expected: unknown }[];
    language?: string;
  };
};

export type TutorAnswerResult = {
  score: number;
  raw_score: number;
  verdict: string;
  feedback: string;
  covered: string[];
  missing: string[];
  tests: {
    passed: number;
    total: number;
    error: string | null;
    failures: { args: unknown[]; expected: unknown; got: unknown }[];
  } | null;
  model_answer: string;
  xp: number;
  streak: number;
  mastery: number;
  module_event: string | null;
  difficulty: number;
  review_sources: { title: string; where: string; url: string; resource_id: number }[];
  reference?: string;
};
