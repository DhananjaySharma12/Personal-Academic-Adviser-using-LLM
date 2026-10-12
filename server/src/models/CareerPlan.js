/**
 * CareerPlan.js — Career Guidance model.
 * Stores AI recommendations, personalized aspirations, bookmarked roles,
 * and skill gap analyses grounded in the student's academic path.
 */
import mongoose from 'mongoose'

const careerPlanSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      unique: true,
      index: true,
    },
    careerVision: {
      type: String,
      trim: true,
      default: '',
    },
    targetRole: {
      type: String,
      trim: true,
      maxlength: 120,
      default: '',
    },
    targetIndustry: {
      type: String,
      trim: true,
      maxlength: 120,
      default: 'Technology & Software',
    },
    experienceLevel: {
      type: String,
      enum: ['Internship', 'Entry-Level / Graduate', 'Junior Specialist', 'Research / Higher Studies'],
      default: 'Entry-Level / Graduate',
    },
    workStyle: {
      type: String,
      enum: ['Hybrid', 'Remote', 'On-site', 'Flexible'],
      default: 'Hybrid',
    },
    customInterests: [
      {
        type: String,
        trim: true,
        maxlength: 60,
      },
    ],
    bookmarkedRoles: [
      {
        roleTitle: { type: String, required: true },
        industry: { type: String, default: '' },
        matchScore: { type: Number, default: 85 },
        matchReason: { type: String, default: '' },
        savedAt: { type: Date, default: Date.now },
      },
    ],
    recommendations: [
      {
        roleTitle: { type: String, required: true },
        industry: { type: String, default: '' },
        matchScore: { type: Number, default: 80 },
        matchReason: { type: String, default: '' },
        salaryRange: { type: String, default: '' },
        demandOutlook: { type: String, default: 'High Growth' },
        description: { type: String, default: '' },
        topSkillsYouHave: [{ type: String }],
        skillsToAcquire: [{ type: String }],
        recommendedCourses: [{ type: String }],
        portfolioProjects: [{ type: String }],
        milestoneRoadmap: [
          {
            stage: { type: String },
            title: { type: String },
            actions: [{ type: String }],
          },
        ],
      },
    ],
    skillGapAnalysis: {
      targetRole: { type: String, default: '' },
      overallReadiness: { type: Number, default: 0 },
      roleOverview: { type: String, default: '' },
      matchedSkills: [{ type: String }],
      missingSkills: [
        {
          skill: { type: String },
          importance: { type: String, default: 'Crucial' },
          howToBridge: { type: String },
          estimatedTimeToLearn: { type: String },
        },
      ],
      courseworkAlignment: [
        {
          subjectName: { type: String },
          relevance: { type: String, default: 'Directly Relevant' },
          suggestedFocus: { type: String },
        },
      ],
      recommendedCertifications: [{ type: String }],
      recommendedActionSteps: [{ type: String }],
      analyzedAt: { type: Date },
    },
  },
  { timestamps: true },
)

export default mongoose.model('CareerPlan', careerPlanSchema)
