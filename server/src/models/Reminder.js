/**
 * Reminder.js — Study & Academic deadline reminders.
 * Scoped to user via userId.
 */
import mongoose from 'mongoose'

const reminderSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    title: {
      type: String,
      required: true,
      trim: true,
      maxlength: 160,
    },
    description: {
      type: String,
      trim: true,
      maxlength: 500,
      default: '',
    },
    dueDate: {
      type: Date,
      required: true,
    },
    type: {
      type: String,
      enum: ['study_task', 'exam', 'assignment', 'quiz', 'custom'],
      default: 'study_task',
    },
    priority: {
      type: String,
      enum: ['high', 'medium', 'low'],
      default: 'medium',
    },
    isCompleted: {
      type: Boolean,
      default: false,
    },
    subjectId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Subject',
      default: null,
    },
  },
  { timestamps: true },
)

export default mongoose.model('Reminder', reminderSchema)
