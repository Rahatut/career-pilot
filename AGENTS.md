# CareerPilot — Agentic Engineering Guide

## Project Overview

CareerPilot is a full-stack career development platform helping job seekers:
- Upload CV → extract skills/profile automatically
- Search jobs ranked by AI fit score
- Track applications via Kanban board
- Generate personalized learning roadmaps
- Chat with AI assistant for cover letters, interview prep

**Stack:** FastAPI (Python 3.11+) + PostgreSQL + React 18 + Vite + Tailwind + Radix UI

---

## Architecture

```
backend/
  main.py                 # FastAPI app, router registration, lifespan
  shared/
    models.py             # SQLAlchemy models (13 tables)
    schemas.py            # Pydantic request/response models
    db.py                 # SQLAlchemy engine, session
    auth.py               # JWT verification (Supabase)
    config.py             # Settings from env
    supabase_client.py    # Admin client for auth
  services/
    auth/                 # Signup, signin, /me
    profile/              # CV upload, parse, embed, profile API
    jobs/                 # JSearch API integration, search, normalize
    fit_score/            # Skills/experience/location/education scoring
    assistant/            # RAG chat, cover letter, tool calling
    tracker/              # Applications, goals, tasks CRUD
    roadmap/              # AI-generated 8-week learning plans
  agents/
    job_hunter.py         # Background job search agent
  alembic/                # Migrations

frontend/
  src/
    lib/api.ts            # Typed API client (mirrors backend schemas)
    lib/supabase.ts       # Supabase client (if used directly)
    contexts/UserContext  # Auth state, user profile
    components/
      pages/              # Dashboard, FindJobs, Roadmap, CVProfile, Onboarding, AuthPage, JobDetail, GoalsCalendar, AIAssistant
      dashboard/          # StatCard, JobCard, KanbanColumn
      ui/                 # 40+ Radix-based primitives
      layout/             # Sidebar
    app/                  # App shell, routing
```

---

## Key Data Models (backend/shared/models.py)

| Model | Purpose |
|-------|---------|
| User | Core identity (email, name) |
| CV / CVSection | Versioned CV storage, parsed sections |
| UserProfile | Aggregated skills, experience, education |
| Job | Normalized external job postings |
| FitScore | Cached user×job fit (score + breakdown + explanation) |
| JobApplication | Kanban status: saved→applied→interview→offer/rejected |
| Goal / Task | User-defined milestones with due dates |
| Roadmap | AI-generated weekly plan (JSON content) |
| ChatSession / ChatMessage | Assistant conversation history |

---

## API Surface (prefixes)

| Prefix | Service | Key Endpoints |
|--------|---------|---------------|
| `/auth` | auth | POST /signup, POST /signin, GET /me |
| `/cv` | profile | POST /upload, GET /, GET /profile, GET /skills |
| `/jobs` | jobs | POST /search, GET /{id} |
| `/fit` | fit_score | GET /score/{job_id}, GET /score/{job_id}/explain |
| `/assistant` | assistant | GET /sessions, POST /sessions, GET /sessions/{id}/messages, POST /chat/stream, POST /cover-letter |
| `/applications` | tracker | GET, POST, PATCH, DELETE |
| `/goals` | tracker | GET, POST, PATCH, DELETE |
| `/tasks` | tracker | GET, POST, PATCH, DELETE |
| `/roadmap` | roadmap | GET /me, POST /generate |

---

## Development Workflow

### Backend
```bash
cd backend
python -m venv .venv && source .venv/bin/activate
pip install -r requirements.txt
cp .env.example .env  # fill in SUPABASE_URL, SUPABASE_SERVICE_KEY, DATABASE_URL, OPENAI_API_KEY, JSEARCH_API_KEY
alembic upgrade head
uvicorn main:app --reload --port 8000
```

### Frontend
```bash
cd frontend
pnpm install
pnpm dev  # Vite on :5173, proxies /api → :8000
```

### Database
- PostgreSQL (local or Supabase)
- Tables auto-create on startup via `Base.metadata.create_all`
- For schema changes: `alembic revision --autogenerate -m "msg"` → `alembic upgrade head`

---

## Agentic Engineering Patterns

### 1. Eval-First Changes
Before modifying fit scoring, roadmap generation, or assistant prompts:
- Write a failing test case (input → expected output)
- Run existing eval suite if available
- Implement minimal change
- Verify eval passes

### 2. Decomposition Rules
- **Single-file edits:** Use `cavecrew-builder` for typo fixes, single function rewrites
- **Code location:** Use `cavecrew-investigator` for "where is X" questions
- **Diff review:** Use `cavecrew-reviewer` before committing
- **Multi-file features:** Plan first, then implement sequentially

### 3. Cost-Aware Model Routing
| Task | Model |
|------|-------|
| Code gen, refactor | claude-3.5-sonnet / gpt-4o |
| Simple edits, search | claude-3.5-haiku / gpt-4o-mini |
| Eval, complex reasoning | claude-3.5-sonnet / gpt-4o |
| Embeddings | text-embedding-3-small |

### 4. Verification Loop (run before PR)
```bash
# Backend
cd backend && python -m pytest tests/ -v --cov=services --cov-fail-under=80
ruff check .
mypy .

# Frontend
cd frontend && pnpm run lint
pnpm run typecheck
pnpm run test -- --coverage
```

---

## .opencode Commands Reference

### Core Commands

| Command | Description | Key Usage |
|---------|-------------|-----------|
| `/build-fix` | Detect build system, fix type/build errors incrementally | After adding code, before PR |
| `/code-review` | Local or GitHub PR review (7 categories, severity gates) | Before merge, on PR |
| `/plan` | Restate requirements, assess risks, create step plan, wait for confirmation | New features, refactors |
| `/project-init` | Detect stack, produce ECC onboarding dry-run plan | First-time setup |
| `/react-review` | React-specific review (hooks, RSC, a11y, render perf) | After React code changes |
| `/react-test` | TDD for React (RTL + Vitest/Jest, behavior-first) | New components, hooks |
| `/security-scan` | Run AgentShield on `.claude/` config surface | Audit agent config |
| `/update-docs` | Sync docs from source-of-truth (package.json, .env.example, routes) | After API/schema changes |

### Spec Kit Commands (Feature Workflow)

| Command | Phase | Description | Next Handoff |
|---------|-------|-------------|--------------|
| `/speckit.specify` | Spec | Create feature spec from natural language; quality checklist | `/speckit.clarify` or `/speckit.plan` |
| `/speckit.clarify` | Spec | Up to 5 targeted questions to resolve ambiguities in spec | `/speckit.plan` |
| `/speckit.constitution` | Governance | Create/update project constitution (principles, governance) | `/speckit.specify` |
| `/speckit.plan` | Plan | Generate design artifacts (research.md, data-model.md, contracts/, quickstart.md) | `/speckit.tasks` |
| `/speckit.tasks` | Plan | Generate dependency-ordered tasks.md from spec+plan+design | `/speckit.analyze` → `/speckit.implement` |
| `/speckit.analyze` | Analyze | Cross-artifact consistency check (spec/plan/tasks) | — |
| `/speckit.checklist` | Plan | Generate custom requirements-quality checklist (UX, API, security, perf) | — |
| `/speckit.implement` | Implement | Execute tasks.md phases (setup → foundational → user stories → polish) | — |
| `/speckit.converge` | Verify | Assess codebase vs spec/plan/tasks, append remaining work as new tasks | `/speckit.implement` |

### Spec Kit Flow
```
speckit.specify → speckit.clarify → speckit.plan → speckit.tasks → speckit.analyze
                                                                ↓
speckit.converge ← speckit.implement (loop until converged)
```

---

## .opencode Agents Reference

| Agent | Role | When to Use | Permissions |
|-------|------|-------------|-------------|
| `build-error-resolver` | Fix build/type errors with minimal diffs | Build fails, TypeScript errors | read, edit, glob, grep, list, bash |
| `code-architect` | Design feature architecture from existing patterns | Complex features, new modules | read, glob, grep, list, bash |
| `code-reviewer` | Expert code review (security, quality, patterns) | **MUST USE after all code changes** | read, glob, grep, list, bash |
| `designer` | Visual direction, UX, design systems, DESIGN.md | **PROACTIVE for all UI work** | read, edit, glob, grep, list, bash |
| `doc-updater` | Codemaps, READMEs, guides from code | New features, API changes | read, edit, glob, grep, list, bash |
| `e2e-runner` | E2E tests (Agent Browser/Playwright), flaky management | Critical user flows, CI | read, edit, glob, grep, list, bash |
| `planner` | Implementation plans with file paths, dependencies, risks | Complex features, refactors | read, glob, grep, list, bash |
| `security-reviewer` | OWASP Top 10, secrets, auth, input validation | **PROACTIVE** after auth, API, user input, DB, payments | read, glob, grep, list, bash |
| `tdd-guide` | Enforce TDD (Red-Green-Refactor, 80%+ coverage) | New features, bugs, refactors | read, edit, glob, grep, list, bash |

### Agent Triggers
- **PROACTIVE** = runs automatically when conditions met
- **MUST USE** = required step in workflow
- All agents have `edit: deny` except `build-error-resolver`, `designer`, `doc-updater`, `e2e-runner`, `tdd-guide`

---

## Available Skills (`.opencode/skills/`)

| Skill | Purpose | Use When |
|-------|---------|----------|
| `accessibility` | WCAG 2.2 AA across Web/iOS/Android | Building/auditing UI for a11y |
| `agentic-engineering` | Eval-first, decomposition, cost-aware routing | Planning/executing engineering work |
| `api-design` | REST patterns (naming, codes, pagination, versioning) | Designing/reviewing REST endpoints |
| `backend-patterns` | Node/Express/Next.js API patterns | Building/reviewing API routes |
| `browser-qa` | Automated post-deploy UI verification (Playwright, axe-core) | Testing deployed features |
| `cavecrew` | Delegate to investigator/builder/reviewer | Code location, single-file edits, diff review |
| `caveman` | Ultra-compressed communication | `/caveman`, "be brief" |
| `caveman-commit` | Conventional Commits compressed | `/commit`, "write commit" |
| `context-budget` | Audit context window consumption | Context filling too fast |
| `database-migrations` | Safe, reversible migration patterns | Schema/data migrations |
| `deployment-patterns` | CI/CD, Docker, health checks, rollback | Setting up CI/CD, containerizing |
| `design-system` | Generate/audit design system (tokens, CSS vars, HTML preview) | Starting design system, PR review |
| `docker-patterns` | Docker/Compose patterns, security, networking | Creating/reviewing Dockerfiles |
| `e2e-testing` | Playwright patterns, POM, CI integration | Writing E2E tests |
| `frontend-a11y` | React/Next.js a11y (ARIA, keyboard, focus) | Forms, modals, dropdowns, tabs |
| `frontend-design-direction` | ECC-specific design direction | Building dashboards, apps, components |
| `frontend-patterns` | React/Next.js patterns, state, performance | Building/reviewing React components |
| `impeccable` | Design, redesign, critique, polish UI | **Any frontend interface work** |
| `make-interfaces-feel-better` | Polish details (spacing, typography, motion, hit areas) | Reviewing/improving UI |
| `no-mistakes` | Automated validation pipeline (review, tests, lint, docs, push, PR, CI) | `/no-mistakes`, gate/ship |
| `postgres-patterns` | PG query optimization, schema, indexing, RLS | Designing PG schemas, slow queries |
| `python-testing` | pytest strategies, TDD, fixtures, mocking | Writing pytest tests |
| `react-patterns` | React 18/19 (hooks, RSC, Suspense, forms, state) | Writing/reviewing React components |
| `react-performance` | 70+ Vercel rules across 8 categories | Writing/refactoring React for perf |
| `react-testing` | RTL + Vitest/Jest + MSW + axe | Testing React components/hooks |
| `security-review` | Comprehensive security checklist | Auth, user input, secrets, payments |
| `security-scan` | AgentShield audit of `.claude/` config | Auditing CLAUDE.md, MCP, hooks |
| `tdd-workflow` | TDD methodology (fail → pass → refactor) | New features, bugs, refactors |
| `ui-demo` | Record polished UI demo videos (Playwright) | Creating walkthrough/tutorial videos |
| `verification-loop` | 6-phase verification (build, type, lint, test, security, diff) | Before PR, after feature complete |

---

## Common Tasks

### Add New API Endpoint
1. Define Pydantic schema in `shared/schemas.py`
2. Add model if persistent in `shared/models.py`
3. Create router in `services/{domain}/router.py`
4. Register in `main.py`
5. Add TypeScript types in `frontend/src/lib/api.ts`
6. Call from frontend component

### Modify Fit Score Algorithm
1. Edit `services/fit_score/scorer.py`
2. Update `services/fit_score/explainer.py` for LLM explanation
3. Add unit tests for new weight combinations
4. Run eval against golden dataset

### Add Assistant Tool
1. Define tool schema in `services/assistant/tools.py`
2. Implement handler
3. Register in `services/assistant/intent.py` or router
4. Add frontend streaming handler in `api.ts` (chatStream)

### New Frontend Page
1. Create component in `src/components/pages/`
2. Add route in `src/app/` router
3. Add sidebar nav item in `Sidebar.tsx`
4. Use existing UI primitives from `src/components/ui/`

---

## Environment Variables

| Variable | Required | Description |
|----------|----------|-------------|
| `DATABASE_URL` | Yes | PostgreSQL connection string |
| `SUPABASE_URL` | Yes | Supabase project URL |
| `SUPABASE_SERVICE_KEY` | Yes | Service role key (admin) |
| `SUPABASE_ANON_KEY` | Frontend | Anon key for client |
| `OPENAI_API_KEY` | Yes | GPT-4o for assistant, embeddings |
| `JSEARCH_API_KEY` | Yes | RapidAPI JSearch for job data |
| `CHROMA_HOST` | Optional | Vector DB for RAG (default localhost:8000) |

---

## Testing Strategy

- **Unit:** pytest for scorers, parsers, normalizers (target >80% coverage)
- **Integration:** Test API routes with TestClient, real DB (testcontainers)
- **E2E:** Playwright for critical flows (auth → CV upload → job search → apply → roadmap)
- **Contract:** Shared TypeScript/Python schemas validated at build

---

## Deployment

- **Backend:** Docker → Fly.io / Render / Railway (port 8000)
- **Frontend:** Vercel / Netlify (build: `vite build`, output: `dist`)
- **Database:** Supabase (PostgreSQL + Auth + Realtime)
- **Vector DB:** Chroma Cloud or self-hosted
- **Secrets:** Never commit `.env`; use platform secret stores

---

## Security Notes

- All endpoints require `Authorization: Bearer <supabase_jwt>`
- `get_current_user` dependency validates token via Supabase
- CORS restricted to `localhost:5173`, `localhost:3000` (add prod domains)
- Rate limiting: add SlowAPI middleware if needed
- File upload: validate PDF/DOCX, size limit 10MB

---

## Performance Targets

| Metric | Target |
|--------|--------|
| API p95 latency | <300ms |
| Fit score computation | <100ms |
| Assistant first token | <2s (streaming) |
| CV parse + embed | <5s async |
| Frontend FCP | <1.5s |
| Lighthouse score | >90 |

---

## Debugging Tips

- Backend logs: `uvicorn` output + `print()` in services
- Frontend network: DevTools → Network → filter `/api`
- Supabase Auth: Check `localStorage.cp_token` in browser
- Chroma: `curl localhost:8000/api/v1/collections`
- Alembic: `alembic history`, `alembic current`

---

## Quick Command Cheatsheet

```bash
# Development
pnpm dev                    # Frontend dev server
uvicorn main:app --reload   # Backend dev server

# Verification (run before PR)
cd backend && python -m pytest tests/ -v --cov=services --cov-fail-under=80 && ruff check . && mypy .
cd frontend && pnpm run lint && pnpm run typecheck && pnpm run test -- --coverage

# Commands (in opencode)
/build-fix                  # Fix build errors
/code-review                # Review local changes
/plan "feature description" # Create implementation plan
/react-review               # React-specific review
/react-test                 # TDD for React component
/security-scan              # Scan agent config
/speckit.specify "feature"  # Create feature spec
/speckit.plan               # Generate design artifacts
/speckit.tasks              # Generate tasks.md
/speckit.implement          # Execute implementation
/speckit.converge           # Verify implementation vs spec
/update-docs                # Sync docs from code
/no-mistakes                # Full validation pipeline

# Skills
/skill:accessibility        # WCAG 2.2 AA audit
/skill:impeccable           # UI critique/audit/harden/polish
/skill:react-review         # React code review patterns
/skill:security-review      # Security checklist
/skill:verification-loop    # 6-phase verification
```