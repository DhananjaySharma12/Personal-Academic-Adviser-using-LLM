/**
 * reminder.routes.js — Endpoints for managing study deadline reminders.
 */
import { Router } from 'express'
import { authenticate } from '../middleware/authenticate.js'
import {
  getReminders,
  createReminder,
  toggleReminder,
  deleteReminder,
} from '../controllers/reminder.controller.js'

const router = Router()

router.use(authenticate)

router.get('/', getReminders)
router.post('/', createReminder)
router.patch('/:id/toggle', toggleReminder)
router.delete('/:id', deleteReminder)

export default router
