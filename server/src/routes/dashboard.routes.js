/**
 * dashboard.routes.js — Endpoints for /api/dashboard.
 */
import { Router } from 'express'
import { authenticate } from '../middleware/authenticate.js'
import { getDashboardStats } from '../controllers/dashboard.controller.js'

const router = Router()

router.use(authenticate)

router.get('/', getDashboardStats)

export default router
