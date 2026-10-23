/**
 * StudentProfile.js — one-to-one with User; stores academic preferences.
 */
import mongoose from 'mongoose'

const studentProfileSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      unique: true,
      index: true,
    },
    displayName: { type: String, trim: true, maxlength: 80, default: '' },
    course: { type: String, trim: true, maxlength: 120, default: '' },
    semester: { type: Number, min: 1, max: 20, default: null },
    institution: { type: String, trim: true, maxlength: 200, default: '' },
    goals: [{ type: String, trim: true, maxlength: 200 }],
    learningPreferences: {
      type: String,
      enum: ['visual', 'reading', 'practice', 'mixed'],
      default: 'mixed',
    },
    weeklyStudyHours: { type: Number, min: 0, max: 168, default: 20 },
    timezone: { type: String, default: 'Asia/Kolkata' },
    careerInterests: [{ type: String, trim: true, maxlength: 100 }],
    onboardingComplete: { type: Boolean, default: false },
    avatarUrl: { type: String, trim: true, maxlength: 2000000, default: '' }, // base64 or URL
    phoneNumber: { type: String, trim: true, maxlength: 30, default: '' },
  },
  { timestamps: true },
)

export default mongoose.model('StudentProfile', studentProfileSchema)
