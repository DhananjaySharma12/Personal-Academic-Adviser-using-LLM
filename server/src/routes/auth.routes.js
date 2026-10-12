/**
 * auth.routes.js — /api/auth endpoints with strict rate limiting.
 */
import { Router } from 'express'
import { rateLimit } from 'express-rate-limit'
import { validate } from '../middleware/validate.js'
import { authenticate } from '../middleware/authenticate.js'
import {
  register,
  login,
  logout,
  me,
  registerSchema,
  loginSchema,
  forgotPassword,
  resetPassword,
} from '../controllers/auth.controller.js'

const router = Router()

// Strict rate limit: 10 req / 15 min per IP for auth endpoints
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    error: { code: 'RATE_LIMITED', message: 'Too many auth attempts. Try again in 15 minutes.' },
  },
})

router.post('/register', authLimiter, validate(registerSchema), register)
router.post('/login', authLimiter, validate(loginSchema), login)
router.post('/logout', authenticate, logout)
router.get('/me', authenticate, me)
router.post('/forgot-password', authLimiter, forgotPassword)
router.post('/reset-password', authLimiter, resetPassword)

export default router
