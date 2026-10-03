# CareerPilot — Product Specification

## Vision

Empower job seekers to navigate their career journey with AI-powered intelligence: from CV parsing to job matching, application tracking, skill gap analysis, and personalized learning roadmaps.

## Target Users

- **Primary:** Early-career professionals (0-5 years exp) in tech/software roles
- **Secondary:** Career switchers, students, senior professionals seeking structured upskilling
- **Pain points:** Resume optimization, finding relevant roles, interview prep, skill gaps, application chaos

## Core Value Proposition

Single platform that connects **profile → opportunities → tracking → growth**:

1. **Parse** CV → structured profile (skills, experience, education)
2. **Match** jobs ranked by AI fit score (skills, experience, location, education)
3. **Track** applications via Kanban (saved → applied → interview → offer/rejected)
4. **Learn** AI-generated 8-week roadmaps targeting skill gaps
5. **Assist** chat for cover letters, interview prep, career questions

---

## Feature Specification

### 1. Authentication & Onboarding

| Flow | Details |
|------|---------|
| Sign up | Email/password via Supabase Auth, auto-create user profile |
| Sign in | JWT token stored in localStorage, attached to all API calls |
| Onboarding | 3-step: Welcome → Upload CV → Set preferences (target role, location, job type) |
| Session | Persistent via `localStorage.cp_token`, validated on app load |

**Endpoints:** `POST /auth/signup`, `POST /auth/signin`, `GET /auth/me`

### 2. CV Upload & Profile Extraction

| Step | Implementation |
|------|----------------|
| Upload | `POST /cv/upload` — PDF/DOCX, max 10MB |
| Parse | `pdfplumber` + `python-docx` → sections (skills, experience, education) |
| Extract | NLP + LLM → normalized skills list, experience years, education level |
| Embed | Sentence-transformers → vector store (Chroma) for RAG |
| Profile | Aggregated in `UserProfile` table (skills[], experience_years, education_level, location) |

**Endpoints:** `POST /cv/upload`, `GET /cv/`, `GET /cv/profile`, `GET /cv/skills`

### 3. Job Search & Fit Scoring

| Component | Details |
|-----------|---------|
| Source | JSearch API (RapidAPI) — normalized to internal `Job` model |
| Search | `POST /jobs/search` — query, location, type, experience, salary filters |
| Fit Score | `GET /fit/score/{job_id}` — weighted: skills 45%, experience 25%, location 15%, education 15% |
| Breakdown | Per-dimension scores + matched/missing skills |
| Explanation | `GET /fit/score/{job_id}/explain` — LLM-generated rationale |
| Caching | `FitScore` table (user×job unique), recompute on profile change |

**Algorithm (services/fit_score/scorer.py):**
```
score = 0.45 * skills_match + 0.25 * experience_match + 0.15 * location_match + 0.15 * education_match
skills_match = Jaccard(cv_skills, job_skills) * 100
experience_match = 1 - |cv_years - job_years| / max(cv_years, job_years, 1)
location_match = exact:100, same_country:70, remote:80, else:30
education_match = level_mapping[cv] >= level_mapping[job] ? 100 : 50
```

### 4. Application Tracker (Kanban)

| Status | Flow |
|--------|------|
| saved | Bookmark from job search |
| applied | User marks applied, auto-sets date |
| interview | Scheduled, tracks rounds |
| offer | Negotiation, acceptance |
| rejected | Closed, optional feedback |
| withdrawn | User cancels |

**Data model:** `JobApplication` (user_id, job_id, status, status_history[], notes, applied_date, deadline, salary)

**Endpoints:** CRUD on `/applications`, `/goals`, `/tasks`

### 5. Learning Roadmaps

| Aspect | Detail |
|--------|--------|
| Generation | `POST /roadmap/generate` — target_role, skill_gaps[], current_level, timeline_weeks |
| Structure | 8 weeks × {theme, focus, milestones[], resources[]} |
| Resources | Type: video/article/course/practice, duration, URL |
| Progress | `weeks_completed`, task checkboxes per week |
| Persistence | `Roadmap.content` JSONB, user can regenerate |

**Prompt template (services/roadmap/generator.py):**
- Input: user profile, target role, skill gaps, timeline
- Output: Structured weekly plan with milestones + curated resources
- Model: GPT-4o, temperature 0.7

### 6. AI Assistant

| Capability | Implementation |
|------------|----------------|
| Chat | Streaming SSE `/assistant/chat/stream` — session-scoped |
| Tools | Cover letter generation, job analysis, interview questions, salary negotiation |
| RAG | Chroma vector store — CV embeddings + job descriptions |
| Memory | `ChatSession` + `ChatMessage` tables, full history |
| Cover Letter | `POST /assistant/cover-letter` — job_id + tone → tailored letter |

**Tools (services/assistant/tools.py):**
- `analyze_job_fit` — deep dive on specific role
- `generate_cover_letter` — tailored to job + profile
- `interview_prep` — behavioral + technical questions
- `salary_benchmark` — market data for role/location
- `skill_gap_analysis` — prioritized learning list

---

## User Journeys

### Happy Path: New User → First Application

1. **Landing** → Sign up (email/password)
2. **Onboarding** → Upload CV → Auto-extract profile
3. **Dashboard** → See stats, skill gaps, top matches
4. **Find Jobs** → Search "ML Engineer Dhaka" → Results ranked by fit
5. **Job Detail** → View fit breakdown, explanation, save
6. **Apply** → Move to "applied" in Kanban
7. **Roadmap** → Generate 8-week plan for skill gaps
8. **Assistant** → "Write cover letter for this role"

### Returning User Daily Flow

1. Dashboard → Check new matches, pipeline status
2. Kanban → Update application statuses
3. Roadmap → Complete weekly tasks, mark done
4. Assistant → Quick question ("How to answer weakness question?")

---

## Data Model Summary

| Entity | Key Fields |
|--------|------------|
| User | id, email, name |
| CV | id, user_id, version, is_active, embedding_status |
| CVSection | id, cv_id, section_type, content, institution, position, dates, meta{skills[]} |
| UserProfile | id, user_id, skills[], experience_years, education_level, location |
| Job | id, external_id, source, title, company, location, skills_required[], salary_min/max |
| FitScore | id, user_id, job_id, score, breakdown{}, matched_skills[], missing_skills[], explanation |
| JobApplication | id, user_id, job_id, status, status_history[], notes, applied_date |
| Goal | id, user_id, title, description, target_date, is_active |
| Task | id, goal_id, user_id, title, status, due_date |
| Roadmap | id, user_id, target_role, content[WeekNode], weeks_completed |
| ChatSession | id, user_id, title |
| ChatMessage | id, session_id, role, content |

---

## API Contract (Frontend ↔ Backend)

All endpoints require `Authorization: Bearer <jwt>`. Base path `/api` proxied by Vite.

### Auth
- `POST /auth/signup` {name, email, password} → {user_id, name, email, token}
- `POST /auth/signin` {email, password} → {user_id, name, email, token}
- `GET /auth/me` → {user_id, name, email}

### CV/Profile
- `POST /cv/upload` (multipart) → {cv_id, sections_count, skills_count}
- `GET /cv/` → {cv_id, embedding_status, profile{skills, education[], experience[]}, sections_count}
- `GET /cv/profile` → {user_id, skills[], education[], experience[]}
- `GET /cv/skills` → {skills[]}

### Jobs
- `POST /jobs/search` {query, location, job_type, experience_level, salary_min, page_size} → {jobs[], total, query}
- `GET /jobs/{id}` → Job detail

### Fit Score
- `GET /fit/score/{job_id}` → {job_id, score, breakdown{skills,experience,location,education}, is_cached}
- `GET /fit/score/{job_id}/explain` → {score, breakdown, explanation, job_title}

### Tracker
- `GET/POST/PATCH/DELETE /applications` → Application[]
- `GET/POST/PATCH/DELETE /goals` → Goal[]
- `GET/POST/PATCH/DELETE /tasks` → Task[]

### Roadmap
- `GET /roadmap/me` → {roadmap_id, target_role, content[], weeks_completed, timeline_weeks, skill_gaps[]}
- `POST /roadmap/generate` {target_role, skill_gaps[], current_level, timeline_weeks} → Roadmap

### Assistant
- `GET /assistant/sessions` → {sessions[{id, title, created_at, updated_at}]}
- `GET /assistant/sessions/{id}/messages` → {messages[{id, role, content, tool}]}
- `POST /assistant/sessions` {title?} → {session_id}
- `POST /assistant/chat/stream` (SSE) {session_id, message} → stream chunks {type: "content"|"tool", text/name}
- `POST /assistant/cover-letter` {job_id, tone?} → {cover_letter}

---

## UI/UX Specification

### Layout
- **Desktop:** Persistent left sidebar (220px), main content max-w-[1400px] centered
- **Mobile:** Collapsible sheet sidebar, top bar with hamburger
- **Navigation:** 8 pages (Dashboard, Find Jobs, AI Assistant, Applications, My CV, Goals, Calendar, Roadmap)

### Pages
| Page | Key Components |
|------|----------------|
| Dashboard | StatCards (applications, interviews, pending, roadmap%), Top Job Matches, Roadmap Progress, AI Nudge, Kanban Preview |
| Find Jobs | Search bar, filters sidebar (location, type, date, fit score), job cards grid (fit badge, skills, save/apply actions) |
| Job Detail | Full description, fit breakdown chart, cover letter generator, apply/save buttons |
| Applications | Kanban board (5 columns), drag-drop status change, inline notes |
| My CV | Upload zone, parsed sections viewer, skills list, re-upload |
| Roadmap | Stats cards, progress bar, weekly accordion (tasks + resources), generate/regenerate |
| AI Assistant | Session list, chat streaming, tool calls visible, cover letter modal |
| Goals/Calendar | CRUD goals with tasks, calendar view with due dates |

### Design System
- **Tokens:** CSS custom properties (theme.css) — colors, spacing, radius, typography
- **Fonts:** Space Grotesk (display), IBM Plex Sans (body)
- **Colors:** Blue primary (#1d4ed8 light / #3b82f6 dark), slate neutrals
- **Components:** 40+ Radix UI primitives wrapped with CVA variants
- **Dark mode:** Class-based `.dark` on root, full token override

---

## Non-Functional Requirements

| Category | Target |
|----------|--------|
| API p95 latency | <300ms |
| Fit score compute | <100ms |
| Assistant first token | <2s streaming |
| CV parse + embed | <5s async |
| Frontend FCP | <1.5s |
| Lighthouse | >90 |
| Test coverage | >80% (backend), >70% (frontend) |
| Accessibility | WCAG 2.2 AA |

---

## Security

- All endpoints JWT-protected via Supabase
- CORS: localhost:5173, localhost:3000 (prod domains added at deploy)
- File upload: PDF/DOCX only, 10MB limit, server-side validation
- Secrets: Never in repo, platform secret stores only
- Rate limiting: TODO (SlowAPI middleware)

---

## Deployment Architecture

```
┌─────────────┐     ┌─────────────┐     ┌─────────────┐
│   Vercel    │────▶│   Fly.io    │────▶│  Supabase   │
│  (Frontend) │     │  (Backend)  │     │  (Postgres) │
└─────────────┘     └─────────────┘     └─────────────┘
                           │                    │
                           ▼                    ▼
                    ┌─────────────┐     ┌─────────────┐
                    │   Chroma    │     │   JSearch   │
                    │  (Vector)   │     │   (API)     │
                    └─────────────┘     └─────────────┘
```

- **Backend:** Docker → Fly.io/Railway/Render, port 8000, health check `/health`
- **Frontend:** `vite build` → `dist/` → Vercel/Netlify
- **Database:** Supabase (managed PostgreSQL + Auth + Realtime)
- **Vector DB:** Chroma Cloud or self-hosted
- **CI/CD:** GitHub Actions → lint, typecheck, test, build, deploy

---

## Roadmap (Post-MVP)

| Phase | Features |
|-------|----------|
| v1.1 | Email notifications, interview reminders, export applications CSV |
| v1.2 | LinkedIn import, GitHub/portfolio integration, referral tracking |
| v2.0 | Multi-user teams (referrals, mock interviews), company insights, salary negotiation coach |
| v2.1 | Mobile app (React Native), offline mode, push notifications |

---

## Success Metrics

| Metric | Target |
|--------|--------|
| Activation (CV uploaded) | >60% of signups |
| Job search → save rate | >30% |
| Application tracking adoption | >40% of active users |
| Roadmap generation | >25% of users with CV |
| Assistant sessions/user/week | >2 |
| Retention (D30) | >35% |

---

## Open Questions

1. **Job source diversity** — Add LinkedIn, Indeed, company career pages?
2. **Monetization** — Freemium (basic free, pro: unlimited searches, advanced roadmap, priority support)?
3. **Team features** — Referral network, shared applications, mentor matching?
4. **Internationalization** — Multi-language CV parsing, localized job boards?