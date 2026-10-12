/**
 * admin.routes.js — Administrative telemetry and management endpoints.
 */
import { Router } from 'express'
import { authenticate, requireAdmin } from '../middleware/authenticate.js'
import {
  getAdminStats,
  getAdminUsers,
  updateUserRole,
} from '../controllers/admin.controller.js'

const router = Router()

router.use(authenticate)
router.use(requireAdmin)

router.get('/stats', getAdminStats)
router.get('/users', getAdminUsers)
router.patch('/users/:id/role', updateUserRole)

export default router
