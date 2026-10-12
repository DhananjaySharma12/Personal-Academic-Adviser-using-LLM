/**
 * conversation.routes.js — /api/conversations endpoints.
 */
import { Router } from 'express'
import { authenticate } from '../middleware/authenticate.js'
import { validate } from '../middleware/validate.js'
import {
  getConversations,
  createConversation,
  getConversationById,
  updateConversation,
  deleteConversation,
  createConversationSchema,
  updateConversationSchema,
} from '../controllers/conversation.controller.js'

const router = Router()

router.use(authenticate)

router.get('/', getConversations)
router.post('/', validate(createConversationSchema), createConversation)
router.get('/:id', getConversationById)
router.patch('/:id', validate(updateConversationSchema), updateConversation)
router.delete('/:id', deleteConversation)

export default router
