import type {
  AuthResponse,
  AuthUser,
  LearningSpace,
  LearnRequest,
  LearningResponse,
  SpaceSummary,
  TutorAnswerResult,
  TutorQuestion,
  TutorStatus,
} from "../types";

const TOKEN_KEY = "resource-atlas-access-token";

export function getAccessToken(): string | null {
  return sessionStorage.getItem(TOKEN_KEY);
}

export function setAccessToken(token: string | null): void {
  if (token) sessionStorage.setItem(TOKEN_KEY, token);
  else sessionStorage.removeItem(TOKEN_KEY);
}

async function requestJson<T>(path: string, init: RequestInit = {}): Promise<T> {
  const headers = new Headers(init.headers);
  headers.set("Content-Type", "application/json");
  const token = getAccessToken();
  if (token) headers.set("Authorization", `Bearer ${token}`);

  const response = await fetch(path, { ...init, headers });
  if (!response.ok) {
    const result = await response.json().catch(() => null);
    if (response.status === 401 && token) {
      setAccessToken(null);
      window.dispatchEvent(new Event("resource-atlas:unauthorized"));
    }
    throw new Error(result?.detail ?? "Something went wrong. Please try again.");
  }
  return response.json() as Promise<T>;
}

function postJson<T>(path: string, body: unknown): Promise<T> {
  return requestJson<T>(path, { method: "POST", body: JSON.stringify(body) });
}

export function registerAccount(email: string, password: string): Promise<AuthResponse> {
  return postJson("/api/auth/register", { email, password });
}

export function signIn(email: string, password: string): Promise<AuthResponse> {
  return postJson("/api/auth/login", { email, password });
}

export function getCurrentUser(): Promise<AuthUser> {
  return requestJson("/api/auth/me");
}

export function listLearningSpaces(): Promise<{ spaces: SpaceSummary[] }> {
  return requestJson("/api/spaces");
}

export function getLearningSpace(spaceId: string): Promise<LearningSpace> {
  return requestJson(`/api/spaces/${encodeURIComponent(spaceId)}`);
}

export function createLearningSpace(request: LearnRequest): Promise<LearningSpace> {
  return postJson("/api/spaces", request);
}

export function getSpaceTutorProgress(spaceId: string): Promise<{ status: TutorStatus }> {
  return requestJson(`/api/spaces/${encodeURIComponent(spaceId)}/tutor/progress`);
}

export function createLearningPath(request: LearnRequest): Promise<LearningResponse> {
  return postJson("/api/learn", request);
}

export function startTutorSession(
  spaceId: string,
  options: { reset?: boolean; reindex?: boolean } = {},
): Promise<{ status: TutorStatus; index: { indexed: number; chunks: number } }> {
  return postJson(`/api/spaces/${encodeURIComponent(spaceId)}/tutor/session`, options);
}

export function getTutorQuestion(spaceId: string): Promise<{ question: TutorQuestion | null }> {
  return requestJson(`/api/spaces/${encodeURIComponent(spaceId)}/tutor/question`);
}

export function submitTutorAnswer(
  spaceId: string,
  questionId: string,
  answer: string,
  seconds: number,
): Promise<{ result: TutorAnswerResult; status: TutorStatus }> {
  return postJson(`/api/spaces/${encodeURIComponent(spaceId)}/tutor/answer`, {
    question_id: questionId,
    answer,
    seconds,
  });
}

export function requestTutorHint(
  spaceId: string,
  questionId: string,
): Promise<{ hint: string }> {
  return postJson(`/api/spaces/${encodeURIComponent(spaceId)}/tutor/hint`, {
    question_id: questionId,
  });
}

export function skipTutorModule(spaceId: string): Promise<{ status: TutorStatus }> {
  return postJson(`/api/spaces/${encodeURIComponent(spaceId)}/tutor/skip-module`, {});
}

export function replayTutorModule(
  spaceId: string,
  moduleId?: string,
): Promise<{ replayed_module_id: string; status: TutorStatus }> {
  return postJson(`/api/spaces/${encodeURIComponent(spaceId)}/tutor/replay-module`, {
    module_id: moduleId ?? null,
  });
}

export function setTutorPreference(
  spaceId: string,
  focusNote: string,
  preferredTypes: string[],
): Promise<{ ok: boolean; status: TutorStatus }> {
  return postJson(`/api/spaces/${encodeURIComponent(spaceId)}/tutor/set-preference`, {
    focus_note: focusNote,
    preferred_types: preferredTypes,
  });
}
