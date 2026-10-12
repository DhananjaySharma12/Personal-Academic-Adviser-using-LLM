/**
 * StudyPlan.js — AI-generated weekly study schedules.
 * Each plan has a week label and a list of study tasks.
 */
import mongoose from 'mongoose'

const taskSchema = new mongoose.Schema(
  {
    day: {
      type: String,
      enum: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'],
      required: true,
    },
    subjectId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Subject',
      default: null,
    },
    subjectName: { type: String, trim: true, maxlength: 100 },
    topic: { type: String, trim: true, maxlength: 200, required: true },
    duration: { type: Number, min: 15, max: 480, default: 60 }, // minutes
    technique: { type: String, trim: true, maxlength: 100 },
    completed: { type: Boolean, default: false },
    notes: { type: String, trim: true, maxlength: 500 },
  },
  { timestamps: true },
)

const studyPlanSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    weekLabel: {
      type: String,
      trim: true,
      maxlength: 60,
      default: 'Current Week',
    },
    weeklyHours: { type: Number, default: 20 },
    focus: { type: String, trim: true, maxlength: 300 },
    tasks: [taskSchema],
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true },
)

export default mongoose.model('StudyPlan', studyPlanSchema)
