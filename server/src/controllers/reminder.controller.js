/**
 * reminder.controller.js — Handles study deadlines, quiz, and task reminders.
 */
import Reminder from '../models/Reminder.js'
import Subject from '../models/Subject.js'
import { ok, created } from '../utils/response.js'
import { badRequest, notFound } from '../utils/ApiError.js'

export async function getReminders(req, res, next) {
  try {
    const userId = req.user.id
    const reminders = await Reminder.find({ userId })
      .populate('subjectId', 'name code color')
      .sort({ isCompleted: 1, dueDate: 1 })

    const subjects = await Subject.find({ userId }).select('_id name code color')

    ok(res, { reminders, subjects })
  } catch (err) {
    next(err)
  }
}

export async function createReminder(req, res, next) {
  try {
    const userId = req.user.id
    const { title, description, dueDate, type, priority, subjectId } = req.body

    if (!title || !title.trim()) {
      throw badRequest('Title is required')
    }
    if (!dueDate) {
      throw badRequest('Due date is required')
    }

    const reminder = await Reminder.create({
      userId,
      title: title.trim(),
      description: description?.trim() || '',
      dueDate: new Date(dueDate),
      type: type || 'study_task',
      priority: priority || 'medium',
      subjectId: subjectId || null,
    })

    const populated = await Reminder.findById(reminder._id).populate('subjectId', 'name code color')
    created(res, populated)
  } catch (err) {
    next(err)
  }
}

export async function toggleReminder(req, res, next) {
  try {
    const userId = req.user.id
    const { id } = req.params

    const reminder = await Reminder.findOne({ _id: id, userId })
    if (!reminder) throw notFound('Reminder not found')

    reminder.isCompleted = !reminder.isCompleted
    await reminder.save()

    const populated = await Reminder.findById(reminder._id).populate('subjectId', 'name code color')
    ok(res, populated)
  } catch (err) {
    next(err)
  }
}

export async function deleteReminder(req, res, next) {
  try {
    const userId = req.user.id
    const { id } = req.params

    const result = await Reminder.findOneAndDelete({ _id: id, userId })
    if (!result) throw notFound('Reminder not found')

    ok(res, { message: 'Reminder deleted successfully', id })
  } catch (err) {
    next(err)
  }
}
