# Deployment Guide

## Architecture

```
┌─────────────┐     ┌─────────────┐     ┌─────────────┐
│   Vercel    │     │   Render    │     │  Supabase   │
│  (Frontend) │────▶│  (Backend)  │────▶│  (Auth+DB)  │
└─────────────┘     └─────────────┘     └─────────────┘
                           │
                           ▼
                    ┌─────────────┐
                    │  Render PG  │
                    │ (App Data)  │
                    └─────────────┘
```

## Quick Start (Local)

```bash
# Start all services
docker-compose up -d

# View logs
docker-compose logs -f backend
docker-compose logs -f frontend

# Stop
docker-compose down
```

## Production Deployment

### 1. Supabase Setup (Auth + Database)
1. Create project at https://supabase.com
2. Get credentials from Settings → API:
   - `SUPABASE_URL`
   - `SUPABASE_SERVICE_ROLE_KEY` (service_role, not anon)
   - `SUPABASE_KEY` (anon key for frontend)

### 2. Backend → Render
1. Connect GitHub repo to Render
2. Create new Web Service → Docker
3. Use `render.yaml` for configuration
4. Add environment variables in Render dashboard:
   - `DATABASE_URL` (auto-linked from Render PostgreSQL)
   - `SUPABASE_URL`
   - `SUPABASE_SERVICE_ROLE_KEY`
   - `OPENAI_API_KEY` (or Gemini key)
   - `RAPIDAPI_KEY` (JSearch API)
5. Create Render PostgreSQL database (links to `DATABASE_URL`)

### 3. Frontend → Vercel
1. Import GitHub repo in Vercel
2. Set Root Directory: `frontend`
3. Build Command: `pnpm run build`
4. Output Directory: `dist`
5. Add Environment Variable:
   - `VITE_API_URL` = `https://your-backend.onrender.com`
6. Deploy

### 4. GitHub Secrets (for CI/CD)
Add these in GitHub repo Settings → Secrets → Actions:

**Vercel:**
- `VERCEL_TOKEN` (from Vercel account settings)
- `VERCEL_ORG_ID` (from Vercel project settings)
- `VERCEL_PROJECT_ID` (from Vercel project settings)

**Render:**
- `RENDER_API_KEY` (from Render account settings)
- `RENDER_SERVICE_ID` (from Render service settings)

## Environment Variables

### Backend (.env)
```env
DATABASE_URL=postgresql://user:pass@host:5432/db
SUPABASE_URL=https://xxx.supabase.co
SUPABASE_SERVICE_ROLE_KEY=xxx
SUPABASE_KEY=xxx
OPENAI_API_KEY=sk-xxx
RAPIDAPI_KEY=xxx
RAPIDAPI_HOST=jsearch.p.rapidapi.com
CHROMA_DB_PATH=./chroma_db
```

### Frontend (.env)
```env
VITE_API_URL=https://your-backend.onrender.com
```

## CI/CD Pipeline

### On Pull Request:
1. Frontend: lint → typecheck → test → build
2. Backend: ruff → mypy → test → docker build

### On Merge to Main:
1. Frontend: auto-deploy to Vercel
2. Backend: auto-deploy to Render

## Useful Commands

```bash
# Manual deploy backend
curl -X POST "https://api.render.com/v1/services/$SERVICE_ID/deploys" \
  -H "Authorization: Bearer $RENDER_API_KEY"

# Manual deploy frontend
npx vercel --prod --token=$VERCEL_TOKEN

# Run migrations on Render
# Add to build command: alembic upgrade head
```

## Troubleshooting

| Issue | Fix |
|-------|-----|
| CORS errors | Add frontend URL to backend CORS origins in `main.py` |
| DB connection | Check `DATABASE_URL` format, ensure Render PG is in same region |
| Auth fails | Verify `SUPABASE_SERVICE_ROLE_KEY` is service_role, not anon |
| Build fails | Check Node/Python versions match CI (Node 20, Python 3.11) |