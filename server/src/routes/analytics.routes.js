import { Router } from 'express'
import { authenticate } from '../middleware/authenticate.js'
import { getAnalyticsData, getAiDiagnosis } from '../controllers/analytics.controller.js'

const router = Router()

router.use(authenticate)

// GET /api/analytics         — full computed metrics dashboard
router.get('/', getAnalyticsData)

// GET /api/analytics/diagnose — AI-generated strength/weakness diagnosis
router.get('/diagnose', getAiDiagnosis)

export default router
