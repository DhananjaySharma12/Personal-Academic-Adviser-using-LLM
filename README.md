# Scholar Sense AI — Personal Academic Adviser & LLM Platform

> **Scholar Sense AI** is a full-stack, enterprise-grade AI Academic Advisor platform designed for university students. It combines real-time course tracking, RAG vector document analysis, AI chat advisory, automated quiz generation with server-side validation, customized study planning, academic strength & weakness analytics, career roadmaps, study deadline reminders, and an administrative telemetry control center.

---

## 🎨 Design Philosophy & Curated Palette

Scholar Sense AI features a **Botanical Obsidian & Soft Sage Luminescence** aesthetic. Rather than generic corporate or default AI templates, the interface is styled with:

- **Primary Botanical Sage (`#84A282`)**: Core interactive highlights, radar charts, and focus states.
- **Pale Laurel (`#B8CFB3`)**: Secondary accents, soft badges, and organic borders.
- **Warm Ivory Linen (`#FEFAF3`)**: Pristine typography, high-contrast headings, and clean cards.
- **Mist Rose Blush (`#F6E2E9`)**: Subtle pastel pop for status tags, milestone badges, and admin markers.
- **Botanical Obsidian (`#0A0F0B`, `#131B14`, `#1A241C`)**: Deep, low eye-strain background layers with subtle luminescence.

---

## 🚀 Key Modules & Capabilities

### 1. AI Academic Advisor (Chat & RAG)
- Conversational tutor grounded in real enrolled coursework, current semester, target GPA, and past assessment scores.
- Anti-hallucination guardrails and automated conversation title generation.
- Spaced repetition and active recall study advice.

### 2. PDF Assistant & Document Vector Search (RAG)
- Local & cloud PDF parsing with semantic chunking and cosine similarity vector retrieval.
- Grounded Q&A against course textbooks and syllabi with source excerpt attribution.

### 3. Smart Study Planner
- Automated weekly schedule generation tailored to syllabus progress and target grades.
- Pomodoro intervals, difficulty weighting, and task completion tracking.

### 4. Interactive Quiz Generator
- Topic-specific multiple choice quizzes generated via Gemini LLM with difficulty tuning.
- **Zero cheating vector**: Answers are never transmitted to the client prior to server-side evaluation.
- Instant explanations, performance history, and missed topic diagnosis.

### 5. Strength & Weakness Analytics
- Composite academic mastery scoring (60% assessment marks + 40% quiz accuracy).
- Radar chart, score distribution breakdown, and AI dean diagnosis action plans.

### 6. Career Guidance & Industry Roadmaps
- AI career matching based on university subjects and demonstrated aptitudes.
- 4-phase transition roadmap (Foundations → Applied Projects → Certifications → Offer Negotiation).
- Deep-dive skill gap analyzer benchmarking transcripts against real-world job postings.

### 7. Reminders & Academic Deadlines
- Timeline alerts for upcoming assignments, quizzes, exams, and study sessions.
- Priority tagging (High / Medium / Low) and overdue detection.

### 8. Admin Control Center
- Platform telemetry: active students, enrolled subjects, vector embeddings, quizzes generated.
- System uptime, LLM model diagnostics, and role management (Student / Admin).

---

## 🛠 Tech Stack

- **Frontend**: React 18, Vite, Tailwind CSS, TanStack Query (v5), Lucide Icons, Framer Motion, Recharts.
- **Backend**: Node.js (ESM), Express.js, MongoDB Atlas (Mongoose), JWT, Zod, Helmet, Rate Limiter.
- **AI & Embeddings**: Google Generative AI (`gemini-flash-latest`, `text-embedding-004`).
- **PDF Processing**: `pdf-parse`, Multer.

---

## 📦 Getting Started

### Prerequisites
- Node.js (v18+)
- MongoDB Atlas database URI
- Google Gemini API key (Free tier from [Google AI Studio](https://aistudio.google.com))

### 1. Server Configuration
Create `server/.env` (or copy from `server/.env.example`):
```env
PORT=5000
NODE_ENV=development
MONGO_URI=your_mongodb_connection_string
JWT_SECRET=your_secure_random_jwt_secret
JWT_EXPIRES_IN=7d
LLM_PROVIDER=gemini
LLM_MODEL=gemini-flash-latest
EMBEDDING_MODEL=text-embedding-004
LLM_API_KEY=your_gemini_api_key
CORS_ORIGINS=http://localhost:5173
MAX_FILE_SIZE_BYTES=10485760
```

### 2. Client Configuration
Create `client/.env`:
```env
VITE_API_BASE_URL=http://localhost:5000
```

### 3. Running Locally

#### Start the Backend API:
```bash
cd server
npm install
npm run dev
```
API runs on `http://localhost:5000`.

#### Start the Frontend Client:
```bash
cd client
npm install
npm run dev
```
Vite dev server runs on `http://localhost:5173`.

---

## 📚 API Endpoint Reference

| Method | Endpoint | Description | Auth Required |
|---|---|---|---|
| `GET` | `/api/health` | Service health check | No |
| `POST` | `/api/auth/register` | Register new student | No |
| `POST` | `/api/auth/login` | Login and receive JWT | No |
| `POST` | `/api/auth/forgot-password` | Request password reset token | No |
| `POST` | `/api/auth/reset-password` | Reset password using token | No |
| `GET` | `/api/auth/me` | Fetch authenticated session | Yes |
| `GET/PUT` | `/api/profile` | Student profile & avatar | Yes |
| `GET` | `/api/dashboard` | Main metrics & overview | Yes |
| `CRUD` | `/api/subjects` | Manage enrolled courses | Yes |
| `CRUD` | `/api/academic-records` | Test marks & assignments | Yes |
| `POST` | `/api/ai/chat` | AI Academic Advisor chat | Yes |
| `CRUD` | `/api/conversations` | Advisor conversation threads | Yes |
| `GET/POST`| `/api/study-plans` | Weekly study plan generation | Yes |
| `POST` | `/api/quizzes/generate` | AI Quiz generation | Yes |
| `POST` | `/api/quizzes/:id/submit`| Submit and evaluate quiz | Yes |
| `GET/POST`| `/api/documents` | Upload & search PDFs (RAG) | Yes |
| `POST` | `/api/documents/:id/ask` | Grounded document Q&A | Yes |
| `GET` | `/api/analytics` | Strengths & weaknesses | Yes |
| `GET` | `/api/analytics/diagnose`| Dean AI performance review | Yes |
| `GET/POST`| `/api/career` | Career matches & roadmaps | Yes |
| `POST` | `/api/career/skill-gap` | Role gap evaluation | Yes |
| `CRUD` | `/api/reminders` | Deadlines & task reminders | Yes |
| `GET` | `/api/admin/stats` | Platform telemetry | Admin |
| `GET` | `/api/admin/users` | Manage registered users | Admin |

---

## 🛡 Security & Resilience
- **JWT Protection**: All student routes are verified against `req.user.id` from token payload.
- **Zero Answer Leakage**: Quiz answers evaluated server-side; correct options omitted from quiz fetch payloads.
- **Heuristic Cooldown Fallbacks**: All Gemini LLM endpoints feature intelligent heuristic backups to ensure zero downtime during free-tier API rate limiting.
- **Production Helmet & Rate Limiting**: Centralized security headers, CORS origin verification, and abuse protection.
