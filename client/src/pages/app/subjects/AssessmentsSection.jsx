import { Trash2, Plus, Award } from 'lucide-react'
import Button from '@/components/ui/Button'

export default function AssessmentsSection({ records = [], subjectId, onOpenRecordModal, onDeleteRecord }) {
  if (records.length === 0) {
    return (
      <div className="py-8 text-center rounded-xl border border-dashed border-border bg-surface/30">
        <Award size={26} className="mx-auto text-text-muted mb-2 opacity-50" />
        <p className="text-xs text-text-secondary font-medium">No assessment records logged yet.</p>
        <p className="text-[11px] text-text-muted mt-0.5">
          Track quizzes, midterm tests, assignments, and exam results.
        </p>
        <Button
          variant="secondary"
          size="sm"
          onClick={() => onOpenRecordModal(subjectId)}
          className="mt-3 inline-flex items-center gap-1.5"
        >
          <Plus size={14} />
          <span>Log First Assessment</span>
        </Button>
      </div>
    )
  }

  return (
    <div className="space-y-3 pt-3">
      <div className="overflow-x-auto rounded-xl border border-border bg-surface/50">
        <table className="w-full text-left text-xs">
          <thead>
            <tr className="border-b border-border text-text-muted bg-raised/40">
              <th className="py-2.5 px-3 font-medium">Assessment</th>
              <th className="py-2.5 px-3 font-medium">Type</th>
              <th className="py-2.5 px-3 font-medium">Date</th>
              <th className="py-2.5 px-3 font-medium">Marks</th>
              <th className="py-2.5 px-3 font-medium">% Score</th>
              <th className="py-2.5 px-3 font-medium">Weight</th>
              <th className="py-2.5 px-3 font-medium text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border/40">
            {records.map((rec) => {
              const pct = Math.round((rec.score / rec.totalMarks) * 100)
              return (
                <tr key={rec._id} className="hover:bg-raised/50 transition-colors">
                  <td className="py-2.5 px-3 font-medium text-text-main">
                    <div>{rec.title}</div>
                    {rec.remarks && (
                      <p className="text-[11px] text-text-muted font-normal mt-0.5 max-w-xs truncate">
                        {rec.remarks}
                      </p>
                    )}
                  </td>
                  <td className="py-2.5 px-3 capitalize text-text-secondary">
                    <span className="inline-block px-2 py-0.5 rounded-md bg-raised text-[10px] font-medium border border-border/60">
                      {rec.type}
                    </span>
                  </td>
                  <td className="py-2.5 px-3 text-text-muted">
                    {new Date(rec.date).toLocaleDateString()}
                  </td>
                  <td className="py-2.5 px-3 text-text-main font-mono font-medium">
                    {rec.score} / {rec.totalMarks}
                  </td>
                  <td className="py-2.5 px-3 font-mono font-bold">
                    <span
                      className={`inline-block px-1.5 py-0.5 rounded text-[11px] ${
                        pct >= 75
                          ? 'text-emerald-400 bg-emerald-500/10'
                          : pct >= 50
                          ? 'text-amber-400 bg-amber-500/10'
                          : 'text-rose-400 bg-rose-500/10'
                      }`}
                    >
                      {pct}%
                    </span>
                  </td>
                  <td className="py-2.5 px-3 text-text-muted">
                    {rec.weightage ? `${rec.weightage}%` : '—'}
                  </td>
                  <td className="py-2.5 px-3 text-right">
                    <button
                      type="button"
                      onClick={() => onDeleteRecord(rec)}
                      className="text-text-muted hover:text-rose-400 p-1 rounded transition-colors"
                      title="Delete assessment"
                    >
                      <Trash2 size={13} />
                    </button>
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>

      <div className="flex justify-end pt-1">
        <Button
          variant="secondary"
          size="sm"
          onClick={() => onOpenRecordModal(subjectId)}
          className="flex items-center gap-1.5 text-xs"
        >
          <Plus size={13} />
          <span>Add Assessment</span>
        </Button>
      </div>
    </div>
  )
}
