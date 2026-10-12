/**
 * index.js — Express app entry point.
 * Validates env first, then connects to DB, then starts server.
 */
import './config/env.js' // must be first — exits if env is invalid
import { env } from './config/env.js'
import express from 'express'
import helmet from 'helmet'
import cors from 'cors'
import { rateLimit } from 'express-rate-limit'
import mongoose from 'mongoose'

// Routes
import authRoutes from './routes/auth.routes.js'
import profileRoutes from './routes/profile.routes.js'
import subjectRoutes from './routes/subject.routes.js'
import academicRecordRoutes from './routes/academicRecord.routes.js'
import dashboardRoutes from './routes/dashboard.routes.js'
import conversationRoutes from './routes/conversation.routes.js'
import aiRoutes from './routes/ai.routes.js'
import studyPlanRoutes from './routes/studyPlan.routes.js'
import studyTaskRoutes from './routes/studyTask.routes.js'
import quizRoutes from './routes/quiz.routes.js'
import documentRoutes from './routes/document.routes.js'
import analyticsRoutes from './routes/analytics.routes.js'
import careerRoutes from './routes/career.routes.js'
import reminderRoutes from './routes/reminder.routes.js'
import adminRoutes from './routes/admin.routes.js'
import { authenticate } from './middleware/authenticate.js'
import { getQuizAttempts } from './controllers/quiz.controller.js'

const app = express()

// ── Security middleware ──────────────────────────────────────────────────────
app.use(helmet())

const allowedOrigins = env.CORS_ORIGINS.split(',').map((o) => o.trim())
app.use(
  cors({
    origin: (origin, cb) => {
      // Allow requests with no origin (e.g. Postman/curl in dev) in non-prod
      if (!origin && env.NODE_ENV !== 'production') return cb(null, true)
      if (allowedOrigins.includes(origin)) return cb(null, true)
      cb(new Error(`CORS: origin ${origin} not allowed`))
    },
    credentials: true,
  }),
)

// ── Body parsing ─────────────────────────────────────────────────────────────
app.use(express.json({ limit: '10mb' }))
app.use(express.urlencoded({ extended: true, limit: '10mb' }))

// ── Global rate limit (override per-router where needed) ──────────────────────
app.use(
  rateLimit({
    windowMs: 15 * 60 * 1000, // 15 min
    max: 200,
    standardHeaders: true,
    legacyHeaders: false,
    message: { success: false, error: { code: 'RATE_LIMITED', message: 'Too many requests' } },
  }),
)

// ── Health check ─────────────────────────────────────────────────────────────
app.get('/api/health', (_req, res) => {
  res.json({ success: true, data: { status: 'ok', timestamp: new Date().toISOString() } })
})

// ── API Routes ───────────────────────────────────────────────────────────────
app.use('/api/auth', authRoutes)
app.use('/api/profile', profileRoutes)
app.use('/api/subjects', subjectRoutes)
app.use('/api/academic-records', academicRecordRoutes)
app.use('/api/dashboard', dashboardRoutes)
app.use('/api/conversations', conversationRoutes)
app.use('/api/ai', aiRoutes)
app.use('/api/study-plans', studyPlanRoutes)
app.use('/api/study-tasks', studyTaskRoutes)
app.use('/api/quizzes', quizRoutes)
app.use('/api/documents', documentRoutes)
app.use('/api/analytics', analyticsRoutes)
app.use('/api/career', careerRoutes)
app.use('/api/reminders', reminderRoutes)
app.use('/api/admin', adminRoutes)
app.get('/api/quiz-attempts', authenticate, getQuizAttempts)

// ── 404 handler ──────────────────────────────────────────────────────────────
app.use((_req, res) => {
  res.status(404).json({ success: false, error: { code: 'NOT_FOUND', message: 'Route not found' } })
})

// ── Central error handler ────────────────────────────────────────────────────
// eslint-disable-next-line no-unused-vars
app.use((err, _req, res, _next) => {
  const status = err.status ?? err.statusCode ?? 500
  const code = err.code ?? 'INTERNAL_ERROR'
  // Never leak stack traces to clients
  console.error(`[ERROR] ${code}:`, err.message)
  res.status(status).json({ success: false, error: { code, message: err.message ?? 'An unexpected error occurred' } })
})

// ── MongoDB + server start ────────────────────────────────────────────────────
mongoose
  .connect(env.MONGO_URI, { dbName: 'scholarsense' })
  .then(() => {
    console.log('✅ MongoDB connected — db: scholarsense')
    app.listen(env.PORT, () => {
      console.log(`🚀 Server running on http://localhost:${env.PORT}`)
      console.log(`   Provider: ${env.LLM_PROVIDER} | Model: ${env.LLM_MODEL}`)
    })
  })
  .catch((err) => {
    console.error('❌ MongoDB connection failed:', err.message)
    process.exit(1)
  })
