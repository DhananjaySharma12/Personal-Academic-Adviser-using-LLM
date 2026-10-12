/**
 * career.routes.js — Express router for Career Guidance.
 */
import { Router } from 'express'
import { authenticate } from '../middleware/authenticate.js'
import {
  getCareerGuidance,
  generateRecommendations,
  updateCareerPreferences,
  toggleBookmark,
  getSkillGapAnalysis,
} from '../controllers/career.controller.js'

const router = Router()

router.use(authenticate)

// GET /api/career — fetch user's career plan & recommendations
router.get('/', getCareerGuidance)

// POST /api/career/recommendations — regenerate/tailor recommendations
router.post('/recommendations', generateRecommendations)

// PUT /api/career/preferences — update user aspirations and preferences
router.put('/preferences', updateCareerPreferences)

// POST /api/career/bookmark — toggle bookmark for a career recommendation
router.post('/bookmark', toggleBookmark)

// POST /api/career/skill-gap — analyze skill gaps for a specific job title
router.post('/skill-gap', getSkillGapAnalysis)

export default router
