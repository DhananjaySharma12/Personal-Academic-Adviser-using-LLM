/**
 * analytics.controller.js — Comprehensive Academic Strength & Weakness Analytics.
 * Computes multi-dimensional student performance metrics across records, quizzes, syllabus, and study adherence.
 */
import Subject from '../models/Subject.js'
import AcademicRecord from '../models/AcademicRecord.js'
import QuizAttempt from '../models/QuizAttempt.js'
import StudyPlan from '../models/StudyPlan.js'
import StudentProfile from '../models/StudentProfile.js'
import { ok } from '../utils/response.js'
import { generateAcademicDiagnosis } from '../services/ai/gemini.service.js'

function calculateTrend(scores) {
  if (!scores || scores.length < 2) return 'stable'
  const recent = scores.slice(-3)
  const first = recent[0]
  const last = recent[recent.length - 1]
  const diff = last - first
  if (diff >= 5) return 'improving'
  if (diff <= -5) return 'declining'
  return 'stable'
}

export async function getAnalyticsData(req, res, next) {
  try {
    const userId = req.user.id

    const [subjects, records, quizAttempts, studyPlans, profile] = await Promise.all([
      Subject.find({ userId }).sort({ name: 1 }),
      AcademicRecord.find({ userId }).sort({ date: 1 }),
      QuizAttempt.find({ userId }).populate('quizId', 'title topic difficulty').sort({ createdAt: 1 }),
      StudyPlan.find({ userId }),
      StudentProfile.findOne({ userId }),
    ])

    // Overall metrics calculation
    let totalRecordMarks = 0
    let totalRecordPossible = 0
    records.forEach((r) => {
      totalRecordMarks += r.score
      totalRecordPossible += r.totalMarks
    })
    const overallAverage =
      totalRecordPossible > 0 ? Math.round((totalRecordMarks / totalRecordPossible) * 100) : null

    let totalQuizScore = 0
    let totalQuizQuestions = 0
    quizAttempts.forEach((q) => {
      totalQuizScore += q.score
      totalQuizQuestions += q.totalQuestions
    })
    const quizAverage =
      totalQuizQuestions > 0 ? Math.round((totalQuizScore / totalQuizQuestions) * 100) : null

    // Composite Mastery: 60% academic records, 40% quizzes if both present
    let compositeMastery = 0
    if (overallAverage !== null && quizAverage !== null) {
      compositeMastery = Math.round(overallAverage * 0.6 + quizAverage * 0.4)
    } else if (overallAverage !== null) {
      compositeMastery = overallAverage
    } else if (quizAverage !== null) {
      compositeMastery = quizAverage
    }

    // Syllabus completion
    let totalTopicsCount = 0
    let completedTopicsCount = 0
    subjects.forEach((s) => {
      totalTopicsCount += s.syllabusTopics.length
      completedTopicsCount += s.syllabusTopics.filter((t) => t.completed).length
    })
    const syllabusCompletion =
      totalTopicsCount > 0 ? Math.round((completedTopicsCount / totalTopicsCount) * 100) : 0

    // Study Plan adherence
    let totalTasksCount = 0
    let completedTasksCount = 0
    studyPlans.forEach((plan) => {
      if (Array.isArray(plan.tasks)) {
        totalTasksCount += plan.tasks.length
        completedTasksCount += plan.tasks.filter((t) => t.completed).length
      }
    })
    const studyPlanAdherence =
      totalTasksCount > 0 ? Math.round((completedTasksCount / totalTasksCount) * 100) : 0

    // Subject-level breakdown
    const subjectBreakdown = subjects.map((subj) => {
      const sId = subj._id.toString()
      const subjRecords = records.filter((r) => r.subjectId.toString() === sId)
      const subjQuizzes = quizAttempts.filter(
        (q) => q.subjectId && q.subjectId.toString() === sId,
      )

      // Academic average for subject
      let subScore = 0
      let subPossible = 0
      const scoreSequence = []
      subjRecords.forEach((r) => {
        subScore += r.score
        subPossible += r.totalMarks
        scoreSequence.push(Math.round((r.score / r.totalMarks) * 100))
      })
      const academicAvg = subPossible > 0 ? Math.round((subScore / subPossible) * 100) : null

      // Quiz average for subject
      let qScore = 0
      let qPossible = 0
      subjQuizzes.forEach((q) => {
        qScore += q.score
        qPossible += q.totalQuestions
        scoreSequence.push(Math.round((q.score / q.totalQuestions) * 100))
      })
      const quizAvg = qPossible > 0 ? Math.round((qScore / qPossible) * 100) : null

      // Composite for subject
      let subjectComposite = null
      if (academicAvg !== null && quizAvg !== null) {
        subjectComposite = Math.round(academicAvg * 0.6 + quizAvg * 0.4)
      } else if (academicAvg !== null) {
        subjectComposite = academicAvg
      } else if (quizAvg !== null) {
        subjectComposite = quizAvg
      }

      const totalSubjTopics = subj.syllabusTopics.length
      const completedSubjTopics = subj.syllabusTopics.filter((t) => t.completed).length
      const syllabusProgress =
        totalSubjTopics > 0 ? Math.round((completedSubjTopics / totalSubjTopics) * 100) : 0

      const trend = calculateTrend(scoreSequence)

      let status = 'unassessed'
      let risk = 'low'
      if (subjectComposite !== null) {
        if (subjectComposite >= 75) {
          status = 'strong'
          risk = 'low'
        } else if (subjectComposite >= 60) {
          status = 'moderate'
          risk = 'medium'
        } else {
          status = 'weak'
          risk = 'high'
        }
      } else if (totalSubjTopics > 0 && syllabusProgress < 20) {
        risk = 'medium'
      }

      return {
        _id: subj._id,
        name: subj.name,
        code: subj.code || '',
        credits: subj.credits || 3,
        color: subj.color || '#C8A96E',
        targetGrade: subj.targetGrade || 'A',
        academicAvg,
        quizAvg,
        compositeScore: subjectComposite,
        assessmentsCount: subjRecords.length,
        quizzesCount: subjQuizzes.length,
        totalTopics: totalSubjTopics,
        completedTopics: completedSubjTopics,
        syllabusProgress,
        trend,
        status,
        risk,
      }
    })

    // Identify Strengths
    const strengths = subjectBreakdown
      .filter((s) => s.status === 'strong' || (s.syllabusProgress >= 70 && (s.compositeScore === null || s.compositeScore >= 70)))
      .map((s) => ({
        subjectId: s._id,
        name: s.name,
        color: s.color,
        score: s.compositeScore || s.academicAvg || s.quizAvg || 80,
        trend: s.trend,
        syllabusProgress: s.syllabusProgress,
        detail: `Achieved ${s.compositeScore || s.academicAvg || 80}% mastery with ${s.syllabusProgress}% syllabus coverage.`,
      }))

    // Identify Weaknesses & Risk Areas
    const weaknesses = subjectBreakdown
      .filter((s) => s.status === 'weak' || s.risk === 'high' || (s.compositeScore !== null && s.compositeScore < 65))
      .map((s) => ({
        subjectId: s._id,
        name: s.name,
        color: s.color,
        score: s.compositeScore || s.academicAvg || s.quizAvg || 50,
        trend: s.trend,
        risk: s.risk,
        targetGrade: s.targetGrade,
        syllabusProgress: s.syllabusProgress,
        detail: `Currently at ${s.compositeScore || s.academicAvg || 50}% — below the target grade benchmark (${s.targetGrade}).`,
      }))

    // Missed Quiz Topics Analysis
    const missedTopicsMap = new Map()
    quizAttempts.forEach((attempt) => {
      const topicName = attempt.quizId?.topic || 'General Practice'
      const subj = subjects.find((s) => s._id.toString() === attempt.subjectId?.toString())
      const subjectName = subj ? subj.name : 'General'

      attempt.answers?.forEach((ans) => {
        if (!ans.isCorrect) {
          const key = `${subjectName}::${topicName}`
          const existing = missedTopicsMap.get(key) || {
            subjectName,
            topic: topicName,
            missCount: 0,
            sampleMistakes: [],
          }
          existing.missCount += 1
          if (ans.questionText && existing.sampleMistakes.length < 2) {
            existing.sampleMistakes.push(ans.questionText)
          }
          missedTopicsMap.set(key, existing)
        }
      })
    })

    const missedTopics = Array.from(missedTopicsMap.values())
      .sort((a, b) => b.missCount - a.missCount)
      .slice(0, 8)

    // Score Distribution Bands
    const distribution = [
      { grade: 'A (90-100%)', min: 90, max: 100, count: 0, color: '#6DBF8A' },
      { grade: 'B (80-89%)', min: 80, max: 89, count: 0, color: '#C8A96E' },
      { grade: 'C (70-79%)', min: 70, max: 79, count: 0, color: '#D4A855' },
      { grade: 'D (60-69%)', min: 60, max: 69, count: 0, color: '#C0645A' },
      { grade: 'F (<60%)', min: 0, max: 59, count: 0, color: '#9B453E' },
    ]

    const allPercentages = [
      ...records.map((r) => Math.round((r.score / r.totalMarks) * 100)),
      ...quizAttempts.map((q) => Math.round((q.score / q.totalQuestions) * 100)),
    ]

    allPercentages.forEach((p) => {
      const bucket = distribution.find((d) => p >= d.min && p <= d.max)
      if (bucket) bucket.count += 1
    })

    // Unified Chronological Performance Timeline
    const timelineEvents = [
      ...records.map((r) => {
        const parentSubj = subjects.find((s) => s._id.toString() === r.subjectId.toString())
        return {
          date: r.date,
          title: r.title,
          type: r.type || 'exam',
          percentage: Math.round((r.score / r.totalMarks) * 100),
          subjectName: parentSubj ? parentSubj.name : 'Unknown',
          subjectColor: parentSubj ? parentSubj.color : '#C8A96E',
        }
      }),
      ...quizAttempts.map((q) => {
        const parentSubj = subjects.find(
          (s) => s._id.toString() === (q.subjectId ? q.subjectId.toString() : ''),
        )
        return {
          date: q.createdAt,
          title: q.quizId?.title || `${q.quizId?.topic || 'Practice'} Quiz`,
          type: 'quiz',
          percentage: Math.round((q.score / q.totalQuestions) * 100),
          subjectName: parentSubj ? parentSubj.name : 'Quiz',
          subjectColor: parentSubj ? parentSubj.color : '#C8A96E',
        }
      }),
    ].sort((a, b) => new Date(a.date) - new Date(b.date))

    ok(res, {
      profile: {
        displayName: profile?.displayName || '',
        course: profile?.course || '',
        semester: profile?.semester || null,
        weeklyStudyHours: profile?.weeklyStudyHours || 20,
        learningPreferences: profile?.learningPreferences || 'mixed',
      },
      overview: {
        overallAverage: overallAverage !== null ? overallAverage : 0,
        quizAverage: quizAverage !== null ? quizAverage : 0,
        compositeMastery: compositeMastery || 0,
        syllabusCompletion,
        studyPlanAdherence,
        totalAssessments: records.length,
        totalQuizzesTaken: quizAttempts.length,
        totalSubjects: subjects.length,
        strongSubjectsCount: strengths.length,
        weakSubjectsCount: weaknesses.length,
      },
      subjects: subjectBreakdown,
      strengths,
      weaknesses,
      missedTopics,
      scoreDistribution: distribution,
      timeline: timelineEvents.slice(-15), // Last 15 events for clean graphs
    })
  } catch (err) {
    next(err)
  }
}

export async function getAiDiagnosis(req, res, next) {
  try {
    const userId = req.user.id

    const [subjects, records, quizAttempts, studyPlans, profile] = await Promise.all([
      Subject.find({ userId }),
      AcademicRecord.find({ userId }),
      QuizAttempt.find({ userId }).populate('quizId', 'title topic difficulty'),
      StudyPlan.find({ userId }),
      StudentProfile.findOne({ userId }),
    ])

    // Compute minimal overview for AI prompt
    let totalRecordMarks = 0
    let totalRecordPossible = 0
    records.forEach((r) => {
      totalRecordMarks += r.score
      totalRecordPossible += r.totalMarks
    })
    const overallAverage =
      totalRecordPossible > 0 ? Math.round((totalRecordMarks / totalRecordPossible) * 100) : 0

    let totalQuizScore = 0
    let totalQuizQuestions = 0
    quizAttempts.forEach((q) => {
      totalQuizScore += q.score
      totalQuizQuestions += q.totalQuestions
    })
    const quizAverage =
      totalQuizQuestions > 0 ? Math.round((totalQuizScore / totalQuizQuestions) * 100) : 0

    const subjectsStats = subjects.map((subj) => {
      const sId = subj._id.toString()
      const sRecords = records.filter((r) => r.subjectId.toString() === sId)
      const sQuizzes = quizAttempts.filter((q) => q.subjectId?.toString() === sId)

      let rScore = 0, rTotal = 0
      sRecords.forEach((r) => { rScore += r.score; rTotal += r.totalMarks })
      const academicAvg = rTotal > 0 ? Math.round((rScore / rTotal) * 100) : null

      let qScore = 0, qTotal = 0
      sQuizzes.forEach((q) => { qScore += q.score; qTotal += q.totalQuestions })
      const qAvg = qTotal > 0 ? Math.round((qScore / qTotal) * 100) : null

      const totalSubjTopics = subj.syllabusTopics.length
      const completedSubjTopics = subj.syllabusTopics.filter((t) => t.completed).length
      const syllabusProgress = totalSubjTopics > 0 ? Math.round((completedSubjTopics / totalSubjTopics) * 100) : 0

      const comp = academicAvg !== null && qAvg !== null ? Math.round(academicAvg * 0.6 + qAvg * 0.4) : academicAvg || qAvg || 65

      return {
        name: subj.name,
        code: subj.code,
        targetGrade: subj.targetGrade,
        academicAvg,
        quizAvg: qAvg,
        syllabusProgress,
        status: comp >= 75 ? 'strong' : comp >= 60 ? 'moderate' : 'weak',
        trend: 'stable',
        risk: comp < 60 ? 'high' : 'low',
      }
    })

    const strongSubjects = subjectsStats.filter((s) => s.status === 'strong')
    const weakSubjects = subjectsStats.filter((s) => s.status === 'weak' || s.risk === 'high')

    const missedTopicsMap = new Map()
    quizAttempts.forEach((a) => {
      const topicName = a.quizId?.topic || 'Practice'
      a.answers?.forEach((ans) => {
        if (!ans.isCorrect) {
          missedTopicsMap.set(topicName, (missedTopicsMap.get(topicName) || 0) + 1)
        }
      })
    })
    const missedTopics = Array.from(missedTopicsMap.entries()).map(([topic, count]) => ({ topic, count }))

    const diagnosis = await generateAcademicDiagnosis({
      studentProfile: {
        displayName: profile?.displayName || 'Student',
        course: profile?.course || 'Undergraduate',
        semester: profile?.semester,
        institution: profile?.institution,
        weeklyStudyHours: profile?.weeklyStudyHours || 20,
        learningPreferences: profile?.learningPreferences || 'mixed',
      },
      overview: {
        overallAverage,
        quizAverage,
        compositeMastery: overallAverage > 0 && quizAverage > 0 ? Math.round(overallAverage * 0.6 + quizAverage * 0.4) : overallAverage || quizAverage || 70,
        syllabusCompletion: 65,
        studyPlanAdherence: 75,
      },
      subjects: subjectsStats,
      strengths: strongSubjects,
      weaknesses: weakSubjects,
      missedTopics,
    })

    ok(res, diagnosis)
  } catch (err) {
    next(err)
  }
}
