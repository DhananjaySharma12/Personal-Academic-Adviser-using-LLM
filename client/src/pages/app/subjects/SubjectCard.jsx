import { useState } from 'react'
import {
  Award,
  ChevronDown,
  ChevronUp,
  Edit2,
  Trash2,
  Plus,
  Layers,
  FileCheck,
} from 'lucide-react'
import Badge from '@/components/ui/Badge'
import SyllabusSection from './SyllabusSection'
import AssessmentsSection from './AssessmentsSection'

export default function SubjectCard({
  subject,
  records = [],
  isExpanded,
  onToggleExpand,
  onEdit,
  onDelete,
  onOpenRecordModal,
  onToggleTopic,
  onAddTopic,
  onDeleteTopic,
  onDeleteRecord,
}) {
  const [activeTab, setActiveTab] = useState('syllabus') // 'syllabus' | 'records'

  const subjectRecords = records.filter(
    (r) => (typeof r.subjectId === 'object' ? r.subjectId?._id : r.subjectId) === subject._id,
  )

  const totalTopics = subject.syllabusTopics?.length || 0
  const completedTopics = subject.syllabusTopics?.filter((t) => t.completed).length || 0
  const progressPct = totalTopics > 0 ? Math.round((completedTopics / totalTopics) * 100) : 0

  let totalScored = 0
  let totalPossible = 0
  subjectRecords.forEach((r) => {
    totalScored += r.score
    totalPossible += r.totalMarks
  })
  const avgPct = totalPossible > 0 ? Math.round((totalScored / totalPossible) * 100) : null

  const color = subject.color || '#84A282'

  return (
    <div
      className="card relative overflow-hidden transition-all duration-200 hover:shadow-lg hover:border-border/90"
      style={{
        borderLeft: `4px solid ${color}`,
      }}
    >
      {/* Top glow accent */}
      <div
        className="pointer-events-none absolute -right-20 -top-20 h-40 w-40 rounded-full blur-3xl opacity-15"
        style={{ backgroundColor: color }}
      />

      {/* Card Header */}
      <div className="p-4 sm:p-5">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <div className="space-y-1.5 flex-1 min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <h3 className="font-display text-base sm:text-lg font-bold text-text-main truncate">
                {subject.name}
              </h3>
              {subject.code && (
                <span className="rounded-md bg-raised px-2 py-0.5 text-xs font-mono font-medium text-text-secondary border border-border">
                  {subject.code}
                </span>
              )}
              <span
                className="inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-[11px] font-semibold text-white"
                style={{ backgroundColor: color }}
              >
                Target: {subject.targetGrade || 'A'}
              </span>
              <span className="text-xs text-text-muted">
                {subject.credits || 3} {subject.credits === 1 ? 'Credit' : 'Credits'}
              </span>
            </div>

            {/* Progress & Quick Stats */}
            <div className="flex flex-wrap items-center gap-4 text-xs text-text-secondary pt-1">
              <div className="flex items-center gap-2 min-w-[180px]">
                <div className="h-1.5 w-24 overflow-hidden rounded-full bg-raised border border-border/40">
                  <div
                    className="h-full rounded-full transition-all duration-500"
                    style={{
                      width: `${progressPct}%`,
                      backgroundColor: color,
                    }}
                  />
                </div>
                <span className="font-medium text-text-main text-[11px]">
                  {completedTopics}/{totalTopics} units ({progressPct}%)
                </span>
              </div>

              {avgPct !== null ? (
                <span className="flex items-center gap-1 text-[11px]">
                  <Award size={13} className="text-amber-400" />
                  <span>Avg Marks:</span>
                  <strong className="text-text-main font-mono">{avgPct}%</strong>
                </span>
              ) : (
                <span className="text-[11px] text-text-muted">No assessments yet</span>
              )}
            </div>
          </div>

          {/* Action buttons */}
          <div className="flex items-center gap-1.5 self-end sm:self-start shrink-0">
            <button
              type="button"
              onClick={() => onOpenRecordModal(subject._id)}
              className="flex items-center gap-1 rounded-lg border border-border bg-surface px-2.5 py-1.5 text-xs font-medium text-text-secondary hover:text-text-main hover:bg-raised transition-colors"
              title="Add assessment record"
            >
              <Plus size={13} />
              <span>Record</span>
            </button>
            <button
              type="button"
              onClick={() => onEdit(subject)}
              className="rounded-lg p-1.5 text-text-muted hover:text-text-main hover:bg-raised transition-colors"
              title="Edit course"
            >
              <Edit2 size={14} />
            </button>
            <button
              type="button"
              onClick={() => onDelete(subject)}
              className="rounded-lg p-1.5 text-text-muted hover:text-rose-400 hover:bg-raised transition-colors"
              title="Delete course"
            >
              <Trash2 size={14} />
            </button>
            <button
              type="button"
              onClick={onToggleExpand}
              className="flex items-center gap-1 rounded-lg bg-raised px-2.5 py-1.5 text-xs font-medium text-text-main hover:bg-border/60 transition-colors"
            >
              <span>{isExpanded ? 'Hide' : 'Details'}</span>
              {isExpanded ? <ChevronUp size={13} /> : <ChevronDown size={13} />}
            </button>
          </div>
        </div>

        {/* Expanded Drawer */}
        {isExpanded && (
          <div className="mt-4 border-t border-border pt-3">
            {/* Tab switchers */}
            <div className="flex items-center gap-3 border-b border-border pb-1.5 text-xs font-medium">
              <button
                type="button"
                onClick={() => setActiveTab('syllabus')}
                className={`flex items-center gap-1.5 pb-1 transition-colors ${
                  activeTab === 'syllabus'
                    ? 'text-primary-soft border-b-2 border-primary font-semibold'
                    : 'text-text-muted hover:text-text-secondary'
                }`}
              >
                <Layers size={14} />
                <span>Syllabus Checklist ({totalTopics})</span>
              </button>
              <button
                type="button"
                onClick={() => setActiveTab('records')}
                className={`flex items-center gap-1.5 pb-1 transition-colors ${
                  activeTab === 'records'
                    ? 'text-primary-soft border-b-2 border-primary font-semibold'
                    : 'text-text-muted hover:text-text-secondary'
                }`}
              >
                <FileCheck size={14} />
                <span>Assessments & Marks ({subjectRecords.length})</span>
              </button>
            </div>

            {/* Tab Body */}
            {activeTab === 'syllabus' ? (
              <SyllabusSection
                subject={subject}
                onToggleTopic={onToggleTopic}
                onAddTopic={onAddTopic}
                onDeleteTopic={onDeleteTopic}
              />
            ) : (
              <AssessmentsSection
                records={subjectRecords}
                subjectId={subject._id}
                onOpenRecordModal={onOpenRecordModal}
                onDeleteRecord={onDeleteRecord}
              />
            )}
          </div>
        )}
      </div>
    </div>
  )
}
