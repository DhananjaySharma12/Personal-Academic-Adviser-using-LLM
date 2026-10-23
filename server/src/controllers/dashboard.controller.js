/**
 * dashboard.controller.js — Computes and returns real academic metrics for dashboard.
 * Pure computed data based on subjects, syllabus progress, and academic records.
 */
import Subject from '../models/Subject.js'
import AcademicRecord from '../models/AcademicRecord.js'
import StudentProfile from '../models/StudentProfile.js'
import { ok } from '../utils/response.js'

export async function getDashboardStats(req, res, next) {
  try {
    const userId = req.user.id

    // Fetch subjects and records in parallel
    const [subjects, records, profile] = await Promise.all([
      Subject.find({ userId }).sort({ name: 1 }),
      AcademicRecord.find({ userId }).sort({ date: -1 }),
      StudentProfile.findOne({ userId }),
    ])

    // Calculate syllabus progress
    let totalTopics = 0
    let completedTopics = 0

    const subjectsWithStats = subjects.map((subj) => {
      const subjRecords = records.filter(
        (r) => r.subjectId.toString() === subj._id.toString(),
      )

      let totalScore = 0
      let totalPossible = 0
      subjRecords.forEach((r) => {
        totalScore += r.score
        totalPossible += r.totalMarks
      })

      const avgPercent =
        totalPossible > 0 ? Math.round((totalScore / totalPossible) * 100) : null

      const subjTotalTopics = subj.syllabusTopics.length
      const subjCompletedTopics = subj.syllabusTopics.filter((t) => t.completed).length

      totalTopics += subjTotalTopics
      completedTopics += subjCompletedTopics

      const syllabusProgress =
        subjTotalTopics > 0
          ? Math.round((subjCompletedTopics / subjTotalTopics) * 100)
          : 0

      return {
        _id: subj._id,
        name: subj.name,
        code: subj.code,
        credits: subj.credits,
        color: subj.color,
        targetGrade: subj.targetGrade,
        assessmentsCount: subjRecords.length,
        averagePercent: avgPercent,
        totalTopics: subjTotalTopics,
        completedTopics: subjCompletedTopics,
        syllabusProgress,
      }
    })

    // Overall metrics
    let grandScore = 0
    let grandPossible = 0
    records.forEach((r) => {
      grandScore += r.score
      grandPossible += r.totalMarks
    })

    const overallAverage =
      grandPossible > 0 ? Math.round((grandScore / grandPossible) * 100) : 0

    const overallSyllabusProgress =
      totalTopics > 0 ? Math.round((completedTopics / totalTopics) * 100) : 0

    // Recent 5 assessments
    const recentRecords = records.slice(0, 5).map((r) => {
      const parentSubj = subjects.find(
        (s) => s._id.toString() === r.subjectId.toString(),
      )
      return {
        _id: r._id,
        title: r.title,
        type: r.type,
        score: r.score,
        totalMarks: r.totalMarks,
        percentage: Math.round((r.score / r.totalMarks) * 100),
        date: r.date,
        subjectName: parentSubj ? parentSubj.name : 'Unknown Subject',
        subjectColor: parentSubj ? parentSubj.color : '#C8A96E',
      }
    })

    ok(res, {
      profile: {
        displayName: profile?.displayName || '',
        course: profile?.course || '',
        semester: profile?.semester || null,
        institution: profile?.institution || '',
        avatarUrl: profile?.avatarUrl || '',
        phoneNumber: profile?.phoneNumber || '',
      },
      stats: {
        totalSubjects: subjects.length,
        totalAssessments: records.length,
        overallAverage,
        overallSyllabusProgress,
        totalTopics,
        completedTopics,
      },
      subjects: subjectsWithStats,
      recentRecords,
    })
  } catch (err) {
    next(err)
  }
}
