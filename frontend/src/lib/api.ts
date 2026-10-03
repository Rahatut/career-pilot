// ─── env ─────────────────────────────────────────────────────────────────────
// Use /api so Vite dev-proxy forwards to the FastAPI backend on :8000
const API_BASE = "/api";

// ─── shared types (mirrors backend shared/schemas.py) ───────────────────────
export interface EducationEntry {
  id: string;
  institution?: string;
  start_date?: string;
  end_date?: string;
  content?: string;
}

export interface ExperienceEntry {
  id: string;
  institution?: string;
  position?: string;
  start_date?: string;
  end_date?: string;
  content?: string;
}

export interface UserProfile {
  user_id: string;
  skills: string[];
  education: EducationEntry[];
  experience: ExperienceEntry[];
}

export interface Job {
  id: string;
  title: string;
  company: string;
  location: string;
  job_type: string;
  skills: string[];
  posted_date: string;
  salary: string;
  fit_score: number;
  url?: string;
}

// ─── auth ────────────────────────────────────────────────────────────────────
export interface AuthResponse {
  user_id: string;
  name: string;
  email: string;
  token: string;
}

export async function signUp(
  name: string,
  email: string,
  password: string
): Promise<AuthResponse> {
  return apiFetch("/auth/signup", {
    method: "POST",
    body: JSON.stringify({ name, email, password }),
  });
}

export async function signIn(email: string, password: string): Promise<AuthResponse> {
  return apiFetch("/auth/signin", {
    method: "POST",
    body: JSON.stringify({ email, password }),
  });
}

// ─── auth token injection ────────────────────────────────────────────────────
// In real Clerk: const token = await window.Clerk.session.getToken()
// Here we mock it for the simulated auth approach:
export async function getAuthToken(): Promise<string> {
  // read from localStorage (written by UserContext on sign-in)
  return localStorage.getItem("cp_token") ?? "";
}

// ─── base fetch ──────────────────────────────────────────────────────────────
async function apiFetch<T>(
  path: string,
  options: RequestInit = {},
  queryParams?: Record<string, string | number | undefined>
): Promise<T> {
  const token = await getAuthToken();

  let url = `${API_BASE}${path}`;
  if (queryParams) {
    const qs = new URLSearchParams(
      Object.entries(queryParams).filter(([, v]) => v !== undefined) as [string, string][]
    ).toString();
    if (qs) url += `?${qs}`;
  }

  const res = await fetch(url, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...(options.headers as Record<string, string>),
    },
  });

  if (!res.ok) {
    const body = await res.text().catch(() => "");
    throw new Error(`${res.status} ${res.statusText}: ${body}`);
  }
  if (res.headers.get("content-type")?.includes("text/event-stream")) {
    return res as unknown as T; // caller handles SSE
  }
  return res.json() as Promise<T>;
}

// ─── cv / profile ────────────────────────────────────────────────────────────
export async function uploadCv(file: File): Promise<{ cv_id: string; sections_count: number; skills_count: number }> {
  const form = new FormData();
  form.append("file", file);
  const token = await getAuthToken();
  
  // Don't set Content-Type header for FormData - browser will set it with boundary
  const res = await fetch(`${API_BASE}/cv/upload`, {
    method: "POST",
    headers: token ? { Authorization: `Bearer ${token}` } : {},
    body: form,
  });
  
  if (!res.ok) {
    const errorText = await res.text();
    throw new Error(`CV upload failed: ${res.status} ${errorText}`);
  }
  const result = await res.json();
  return result;
}

export async function getUserProfile(): Promise<UserProfile> {
  return apiFetch("/cv/profile");
}

export async function getSkills(): Promise<{ skills: string[] }> {
  return apiFetch("/cv/skills");
}

// ─── jobs ────────────────────────────────────────────────────────────────────
export interface JobSearchResult {
  jobs: Job[];
  total: number;
  query: string;
}

export async function searchJobs(params: {
  query?: string;
  location?: string;
  job_type?: string;
  experience_level?: string;
  salary_min?: number;
}): Promise<JobSearchResult> {
  return apiFetch("/jobs/search", { method: "POST" }, params as Record<string, string | number>);
}

export async function getJobDetail(jobId: string): Promise<Job> {
  return apiFetch(`/jobs/${jobId}`);
}

export async function getJobFitScore(
  jobId: string
): Promise<{ score: number; breakdown: { skills: number; experience: number; location: number; education: number }; explanations: string[] }> {
  return apiFetch(`/fit/score/${jobId}`);
}

// ─── dashboard ───────────────────────────────────────────────────────────────
export interface DashboardStats {
  total_applications: number;
  interviews: number;
  pending: number;
  rejected: number;
  applied_recently: { id: string; job_title: string; company: string; status: string; applied_date: string }[];
  skill_gaps: string[];
  weekly_goals: { id: string; title: string; completed: boolean }[];
  fit_distribution: { range: string; count: number }[];
}

export async function getDashboard(): Promise<DashboardStats> {
  return apiFetch("/dashboard");
}

// ─── tracker — applications ──────────────────────────────────────────────────
export interface Application {
  id?: string;
  user_id?: string;
  job_title: string;
  company: string;
  status: "saved" | "applied" | "interview" | "offer" | "rejected" | "withdrawn";
  applied_date?: string;
  deadline?: string;
  salary?: string;
  notes?: string;
}

export async function getApplications(): Promise<Application[]> {
  return apiFetch("/applications");
}

export async function createApplication(data: Omit<Application, "id">): Promise<Application> {
  return apiFetch("/applications", { method: "POST", body: JSON.stringify(data) });
}

export async function updateApplication(id: string, data: Partial<Application>): Promise<Application> {
  return apiFetch(`/applications/${id}`, { method: "PATCH", body: JSON.stringify(data) });
}

export async function deleteApplication(id: string): Promise<void> {
  await apiFetch(`/applications/${id}`, { method: "DELETE" });
}

// ─── tracker — goals ─────────────────────────────────────────────────────────
export interface Goal {
  id?: string;
  user_id?: string;
  title: string;
  description?: string;
  target_date?: string;
  completed?: boolean;
  created_at?: string;
}

export async function getGoals(): Promise<Goal[]> {
  return apiFetch("/goals");
}

export async function createGoal(data: Omit<Goal, "id">): Promise<Goal> {
  return apiFetch("/goals", { method: "POST", body: JSON.stringify(data) });
}

export async function updateGoal(id: string, data: Partial<Goal>): Promise<Goal> {
  return apiFetch(`/goals/${id}`, { method: "PATCH", body: JSON.stringify(data) });
}

export async function deleteGoal(id: string): Promise<void> {
  await apiFetch(`/goals/${id}`, { method: "DELETE" });
}

// ─── tracker — tasks ──────────────────────────────────────────────────────────
export interface Task {
  id?: string;
  user_id?: string;
  title: string;
  goal_id?: string;
  due_date?: string;
  completed?: boolean;
  created_at?: string;
}

export async function getTasks(): Promise<Task[]> {
  return apiFetch("/tasks");
}

export async function createTask(data: Omit<Task, "id">): Promise<Task> {
  return apiFetch("/tasks", { method: "POST", body: JSON.stringify(data) });
}

export async function updateTask(id: string, data: Partial<Task>): Promise<Task> {
  return apiFetch(`/tasks/${id}`, { method: "PATCH", body: JSON.stringify(data) });
}

export async function deleteTask(id: string): Promise<void> {
  await apiFetch(`/tasks/${id}`, { method: "DELETE" });
}

// ─── roadmap ─────────────────────────────────────────────────────────────────
// Backend: GET /roadmap/me → {roadmap_id, target_role, content, weeks_completed}
//           POST /roadmap/generate → {roadmap_id, target_role, weeks, weeks_completed}
export interface RoadmapNode {
  week: number;
  topic: string;
  skills?: string[];
  resources?: Array<{ title?: string; name?: string; type?: string; duration?: string; url?: string }>;
  milestones?: string[];
  status?: "locked" | "current" | "done";
}

export interface Roadmap {
  roadmap_id?: string;
  target_role?: string;
  current_role?: string;
  content: RoadmapNode[];
  weeks_completed?: number;
  timeline_weeks?: number;
  skill_gaps?: string[];
}

export async function getRoadmap(): Promise<Roadmap> {
  return apiFetch("/roadmap/me");
}

export async function generateRoadmap(params: {
  target_role: string;
  skill_gaps?: string[];
  current_level?: string;
  timeline_weeks?: number;
}): Promise<Roadmap> {
  return apiFetch("/roadmap/generate", { method: "POST", body: JSON.stringify(params) });
}

// ─── assistant — sessions ─────────────────────────────────────────────────────
export interface ChatSession {
  id: string;
  title: string;
  created_at: string;
  updated_at: string;
}

export interface ChatMessage {
  id: string;
  role: "user" | "assistant";
  content: string;
  tool?: string;
}

export async function getSessions(): Promise<{ sessions: ChatSession[] }> {
  return apiFetch("/assistant/sessions");
}

export async function getSessionMessages(sessionId: string): Promise<{ messages: ChatMessage[] }> {
  return apiFetch(`/assistant/sessions/${sessionId}/messages`);
}

export async function createSession(title?: string): Promise<{ session_id: string }> {
  return apiFetch("/assistant/sessions", { method: "POST", body: JSON.stringify({ title }) });
}

// ─── streaming chat ────────────────────────────────────────────────────────────
// Returns an AsyncIterable<string> of SSE text chunks
export async function chatStream(
  sessionId: string,
  message: string,
  onChunk: (text: string) => void,
  onTool?: (tool: string) => void,
  signal?: AbortSignal
): Promise<void> {
  const token = await getAuthToken();
  const res = await fetch(`${API_BASE}/assistant/chat/stream`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: JSON.stringify({ session_id: sessionId, message }),
    signal,
  });

  if (!res.ok) throw new Error(`${res.status} ${res.statusText}`);

  const reader = res.body!.getReader();
  const decoder = new TextDecoder();
  let buffer = "";

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;

    buffer += decoder.decode(value, { stream: true });
    const lines = buffer.split("\n");
    buffer = lines.pop() ?? "";

    for (const line of lines) {
      if (!line.startsWith("data: ")) continue;
      const data = line.slice(6).trim();
      if (data === "[DONE]") return;
      try {
        const parsed = JSON.parse(data);
        if (parsed.type === "tool") onTool?.(parsed.name ?? "");
        else if (parsed.type === "content") onChunk(parsed.text ?? "");
      } catch {
        // partial chunk
        onChunk(data);
      }
    }
  }
}

// ─── cover letter ─────────────────────────────────────────────────────────────
export async function generateCoverLetter(params: {
  job_id: string;
  tone?: string;
}): Promise<{ cover_letter: string }> {
  return apiFetch("/assistant/cover-letter", { method: "POST", body: JSON.stringify(params) });
}