/**
 * ai.routes.js — /api/ai endpoints.
 */
import { Router } from 'express'
import { authenticate } from '../middleware/authenticate.js'
import { validate } from '../middleware/validate.js'
import {
  sendMessage,
  sendMessageSchema,
} from '../controllers/conversation.controller.js'

const router = Router()

router.use(authenticate)

router.post('/chat', validate(sendMessageSchema), sendMessage)

export default router
