/**
 * profile.routes.js — /api/profile (protected).
 */
import { Router } from 'express'
import { authenticate } from '../middleware/authenticate.js'
import { validate } from '../middleware/validate.js'
import { getProfile, updateProfile, updateProfileSchema } from '../controllers/profile.controller.js'

const router = Router()

router.use(authenticate) // all profile routes require auth

router.get('/', getProfile)
router.put('/', validate(updateProfileSchema), updateProfile)

export default router
