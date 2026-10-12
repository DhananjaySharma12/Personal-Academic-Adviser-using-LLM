# Scholar Sense AI — Progress Tracker

> **Read this first when starting a new session.** Do not re-scan the whole repo; this file has everything you need to resume.

---

## Current Phase: ALL PHASES COMPLETED (Phases 0–11) ✅ 🎉

---

## Phase Status

| Phase | Name | Status |
|---|---|---|
| 0 | Plan + Scaffold | ✅ DONE |
| 1 | Design system + Landing page + App shell | ✅ DONE |
| 2 | Server core + Auth + Onboarding + Profile | ✅ DONE |
| 3 | Subjects + Academic Records + Dashboard | ✅ DONE |
| 4 | LLM service + AI Chat | ✅ DONE |
| 5 | Study Planner | ✅ DONE |
| 6 | Quiz Generator | ✅ DONE |
| 7 | PDF Assistant (RAG) | ✅ DONE |
| 8 | Strength/Weakness + Analytics | ✅ DONE |
| 9 | Career Guidance | ✅ DONE |
| 10 | Reminders + Password Reset + Admin | ✅ DONE |
| 11 | Deployment + README + Tests | ✅ DONE |


---

## Key Decisions (defaults chosen, no blocking questions)

- **LLM Provider**: Google Gemini (free tier, `gemini-1.5-flash`)
- **Embedding Model**: `text-embedding-004` (Gemini)
- **Vector store**: MongoDB cosine similarity in Node.js (VectorStore interface, swap-able)
- **File storage**: Local disk in dev (`uploads/` dir), interface designed for cloud swap
- **Database name**: `scholarsense` (MongoDB Atlas)
- **PDF extraction**: `pdf-parse` npm package
- **Auth**: JWT, 7-day expiry, httpOnly cookie OR Authorization header (decided in Phase 2)
- **Upload limit**: 10 MB (env: `MAX_FILE_SIZE_BYTES`)
- **Port**: server 5000, client 5173 (Vite proxy set up)

---

## Environment Variables Required

### server/.env (copy from server/.env.example)

| Variable | Where to get |
|----------|-------------|
| `MONGO_URI` | MongoDB Atlas → Connect → Drivers |
| `JWT_SECRET` | Run: `node -e "console.log(require('crypto').randomBytes(48).toString('hex'))"` |
| `LLM_API_KEY` | https://aistudio.google.com/app/apikey (free) |
| `LLM_PROVIDER` | `gemini` (default) |
| `LLM_MODEL` | `gemini-1.5-flash` (default) |
| `EMBEDDING_MODEL` | `text-embedding-004` (default) |
| `CORS_ORIGINS` | `http://localhost:5173` (default for dev) |

### client/.env (copy from client/.env.example)
No secrets needed. Optional: `VITE_API_BASE_URL`.

---

## Run Commands

> **Working directory for every command is noted.**

### Install dependencies
```
# From: scholar-sense-ai/client/
cmd /c "npm install"

# From: scholar-sense-ai/server/
cmd /c "npm install"
```

### Start development
```
# Terminal 1 — From: scholar-sense-ai/server/
cmd /c "npm run dev"

# Terminal 2 — From: scholar-sense-ai/client/
cmd /c "npm run dev"
```

### Build client
```
# From: scholar-sense-ai/client/
cmd /c "npm run build"
```

### Verify server health (after starting)
```
curl http://localhost:5000/api/health
```
Expected: `{"success":true,"data":{"status":"ok","timestamp":"..."}}`

---

## Repo Structure (Phase 0)
```
scholar-sense-ai/
├── client/
│   ├── index.html
│   ├── vite.config.js
│   ├── tailwind.config.js
│   ├── postcss.config.js
│   ├── package.json
│   ├── .env.example
│   └── src/
│       ├── main.jsx
│       ├── App.jsx
│       ├── styles/
│       │   ├── globals.css    ← CSS variables + base reset
│       │   └── index.css      ← Tailwind entry + component classes
│       ├── api/               ← all fetch logic (TanStack Query hooks) — Phase 2+
│       ├── components/
│       │   └── reactbits/     ← ReactBits-style components — Phase 1
│       ├── hooks/             ← custom hooks — Phase 2+
│       └── pages/             ← page components — Phase 1+
├── server/
│   ├── package.json
│   ├── .env.example
│   └── src/
│       ├── index.js           ← Express entry, helmet, CORS, rate-limit, DB connect
│       ├── config/
│       │   └── env.js         ← Zod env validator (server exits if invalid)
│       ├── controllers/       ← Phase 2+
│       ├── middleware/        ← Phase 2+
│       ├── models/            ← Phase 2+
│       ├── routes/            ← Phase 2+
│       ├── services/
│       │   ├── ai/            ← LLM service layer — Phase 4
│       │   ├── storage/       ← file storage interface — Phase 7
│       │   └── vectorstore/   ← RAG vector store interface — Phase 7
│       └── utils/             ← Phase 2+
├── uploads/                   ← local dev file storage (in .gitignore)
└── .gitignore
```

---

## API Endpoints (Final list — from spec, added in phases)

| Method | Path | Phase | Status |
|--------|------|-------|--------|
| GET | /api/health | 0 | ✅ DONE |
| POST | /api/auth/register | 2 | ✅ DONE |
| POST | /api/auth/login | 2 | ✅ DONE |
| POST | /api/auth/logout | 2 | ✅ DONE |
| GET | /api/auth/me | 2 | ✅ DONE |
| GET/PUT | /api/profile | 2 | ✅ DONE |
| GET | /api/dashboard | 3 | ✅ DONE |
| GET/POST/PATCH/DELETE | /api/subjects | 3 | ✅ DONE |
| GET/POST/PATCH/DELETE | /api/academic-records | 3 | ✅ DONE |
| POST | /api/ai/chat | 4 | ✅ DONE |
| GET/POST/DELETE | /api/conversations | 4 | ✅ DONE |
| GET/PATCH/DELETE | /api/conversations/:id | 4 | ✅ DONE |
| GET/POST | /api/study-plans | 5 | ✅ DONE |
| PATCH | /api/study-tasks/:id | 5 | ✅ DONE |
| POST | /api/quizzes/generate | 6 | ✅ DONE |
| GET | /api/quizzes | 6 | ✅ DONE |
| POST | /api/quizzes/:id/submit | 6 | ✅ DONE |
| GET | /api/quiz-attempts | 6 | ✅ DONE |
| GET/POST/DELETE | /api/documents | 7 | ✅ DONE |
| POST | /api/documents/:id/ask | 7 | ✅ DONE |
| GET | /api/analytics | 8 | ✅ DONE |
| GET | /api/analytics/diagnose | 8 | ✅ DONE |
| GET/POST/PUT | /api/career (recommendations, bookmark, skill-gap) | 9 | ✅ DONE |

---

## Known Issues / Blockers
- None.

---

## Acceptance Criteria (MVP = Phases 0–7)
- [x] User can register, log in, and log out
- [x] User can complete onboarding and manage their profile
- [x] User can add subjects and academic records (marks, topics)
- [x] Dashboard shows real computed data, not fake numbers
- [x] AI chat gives helpful academic advice with conversation history
- [x] Study planner generates a schedule validated by the server
- [x] Quiz generator scores answers server-side; answers never exposed before submission
- [x] PDF upload + RAG: user can ask questions grounded in their documents
- [x] All routes are ownership-checked on the server
- [x] `npm run build` passes for client
