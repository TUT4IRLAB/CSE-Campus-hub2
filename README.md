# Campus Hub

React + Vite frontend with an Express + Prisma + PostgreSQL backend.

```
.
├── src/                  # Frontend (Vite + React + Tailwind)
│   └── lib/api.ts        # Fetch client for the backend — wire this into pages
├── backend/              # Express + Prisma API
│   ├── prisma/schema.prisma
│   ├── src/              # controllers, routes, middleware
│   └── api/index.ts      # Vercel serverless entry (wraps the Express app)
├── docker-compose.yml    # Local/personal use: Postgres + backend + frontend
└── Dockerfile.frontend
```

## What's implemented

Entities: `User` (Student / Security Guard), `StudyGroup` (+ membership), `LostItem`,
`Textbook`, `CampusEvent` (+ registration).

Endpoints (all under `/api`):
- `POST /auth/register`, `POST /auth/login`, `POST /auth/forgot-password`, `GET /auth/me`
- `GET/POST /study-groups`, `DELETE /study-groups/:id` (owner only), `GET /study-groups/mine`, `POST /study-groups/:id/join`, `POST /study-groups/:id/leave`
- `GET/POST /lost-items`, `GET /lost-items/mine`, `PATCH /lost-items/:id/status` and `DELETE /lost-items/:id` (security guards only)
- `GET/POST /textbooks`, `GET /textbooks/mine`, `GET /textbooks/:id`, `DELETE /textbooks/:id`
- `GET/POST /events`, `DELETE /events/:id` (creator only), `GET /events/mine`, `POST /events/:id/register`, `DELETE /events/:id/register`

Admin (role `ADMIN`, all under `/api/admin`, admin-only):
- `GET /admin/overview` — every user and every post, with who posted it
- `DELETE /admin/:type/:id` — delete any study group, lost item, textbook or event
  (`type` is `study-groups`, `lost-items`, `textbooks` or `events`)

Seeded test accounts (password `password123` for all):
- Students: `lerato.mokoena@campus.ac.za`, `kabelo.mahlangu@campus.ac.za`
- Security: `sipho.dlamini@campus.ac.za`, `zanele.mthembu@campus.ac.za`
- Admin: `admin@campus.ac.za`

Auth is JWT-based (`Authorization: Bearer <token>`), passwords hashed with bcrypt.
`requireRole("SECURITY_GUARD")` gates the lost-item status endpoint the same way the
Figma design gates the Security Dashboard.

**Not yet wired up:** the frontend pages (`src/pages/*.tsx`) still use the mock arrays in
`src/data.ts`. `src/lib/api.ts` is ready to call the real backend — swap each page's
`useState(MOCK_DATA)` for a `useEffect` that calls the matching `api.*` function. Also
stubbed: actual email delivery for `forgot-password` (currently just returns 200), and
image uploads (textbook/lost-item images are still plain URL strings).

## Local development (Docker — "personal use")

```bash
cp backend/.env.example backend/.env   # already points at the compose Postgres
cp .env.example .env                   # frontend: VITE_API_URL

docker compose up --build
```

- Postgres → `localhost:5432`
- Backend API → `http://localhost:4000/api` (migrations run automatically on boot)
- Frontend → `http://localhost:5173`

Seed demo data (run once, after the containers are up):

```bash
docker compose exec backend npm run seed
```

Demo logins (password for all: `password123`):
- Student: `lerato.mokoena@campus.ac.za`
- Security guard: `sipho.dlamini@campus.ac.za`

### Running without Docker

```bash
# Backend
cd backend
npm install
cp .env.example .env            # point DATABASE_URL at any Postgres instance
npx prisma migrate dev
npm run seed
npm run dev                     # http://localhost:4000

# Frontend (separate terminal)
cd ..
pnpm install
pnpm dev                        # http://localhost:5173
```

## Deploying

### Frontend → Vercel
Import the repo root in Vercel, framework preset **Vite**. Set the env var:
- `VITE_API_URL` = your deployed backend URL + `/api` (e.g. `https://campus-hub-api.vercel.app/api`)

### Backend → Vercel
Import the `backend/` folder as its own Vercel project (Root Directory = `backend`).
`vercel.json` and `api/index.ts` already wrap the Express app as a serverless function.
Set these env vars in the Vercel project:
- `DATABASE_URL` — see note below on Postgres
- `JWT_SECRET` — generate with `openssl rand -base64 48`
- `CORS_ORIGIN` — your frontend's Vercel URL

**Postgres for the Vercel backend:** Vercel's serverless functions open a fresh DB
connection per cold start, which plain long-lived Postgres connections don't handle
well. Use a serverless-friendly Postgres provider instead of the Docker Postgres:
[Neon](https://neon.tech) or [Supabase](https://supabase.com) both work well and have
free tiers — grab their pooled connection string and use it as `DATABASE_URL`.

After the first deploy, run migrations against that database once:
```bash
DATABASE_URL="<your-neon-or-supabase-url>" npx prisma migrate deploy
```

### Backend elsewhere (Docker-friendly alternative)
If you'd rather keep the backend as a normal long-running Docker container instead of
serverless functions, `backend/Dockerfile` deploys as-is to Fly.io, Railway, Render, or
Cloud Run — Vercel just can't run it directly (it doesn't support arbitrary Dockerfiles).
