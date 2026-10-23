import { useState, useEffect } from 'react'
import Modal from '@/components/ui/Modal'
import Input from '@/components/ui/Input'
import Button from '@/components/ui/Button'
import { FileCheck, Calendar, Percent } from 'lucide-react'

export default function RecordModal({
  isOpen,
  onClose,
  onSubmit,
  subjects = [],
  defaultSubjectId = '',
  isLoading,
}) {
  const [formData, setFormData] = useState({
    subjectId: '',
    title: '',
    type: 'exam',
    score: '',
    totalMarks: '100',
    weightage: '20',
    date: new Date().toISOString().split('T')[0],
    remarks: '',
  })

  useEffect(() => {
    if (isOpen) {
      setFormData({
        subjectId: defaultSubjectId || subjects[0]?._id || '',
        title: '',
        type: 'exam',
        score: '',
        totalMarks: '100',
        weightage: '20',
        date: new Date().toISOString().split('T')[0],
        remarks: '',
      })
    }
  }, [isOpen, defaultSubjectId, subjects])

  const calculatedPct =
    formData.score && formData.totalMarks && Number(formData.totalMarks) > 0
      ? Math.round((Number(formData.score) / Number(formData.totalMarks)) * 100)
      : null

  const handleSubmit = (e) => {
    e.preventDefault()
    if (!formData.title.trim() || !formData.subjectId) return

    const scoreNum = Number(formData.score)
    const totalMarksNum = Number(formData.totalMarks)
    if (isNaN(scoreNum) || isNaN(totalMarksNum)) return

    onSubmit({
      subjectId: formData.subjectId,
      title: formData.title.trim(),
      type: formData.type,
      score: scoreNum,
      totalMarks: totalMarksNum,
      weightage: Number(formData.weightage) || 0,
      date: new Date(formData.date),
      remarks: formData.remarks.trim(),
    })
  }

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Record Assessment / Marks"
      size="md"
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="mb-1.5 block text-xs font-medium text-text-secondary">
            Enrolled Subject
          </label>
          <select
            value={formData.subjectId}
            onChange={(e) => setFormData((prev) => ({ ...prev, subjectId: e.target.value }))}
            className="input text-xs w-full bg-raised border-border text-text-main cursor-pointer"
            required
          >
            <option value="" disabled>Select Subject</option>
            {subjects.map((s) => (
              <option key={s._id} value={s._id}>
                {s.name} {s.code ? `(${s.code})` : ''}
              </option>
            ))}
          </select>
        </div>

        <Input
          label="Assessment Title"
          placeholder="e.g. Midterm 1, Assignment 2, Quiz on Trees"
          icon={FileCheck}
          value={formData.title}
          onChange={(e) => setFormData((prev) => ({ ...prev, title: e.target.value }))}
          required
          autoFocus
        />

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label className="mb-1.5 block text-xs font-medium text-text-secondary">
              Assessment Type
            </label>
            <select
              value={formData.type}
              onChange={(e) => setFormData((prev) => ({ ...prev, type: e.target.value }))}
              className="input text-xs w-full bg-raised border-border text-text-main cursor-pointer"
            >
              <option value="exam">Final / Semester Exam</option>
              <option value="midterm">Midterm Examination</option>
              <option value="quiz">Quiz / Class Test</option>
              <option value="assignment">Assignment / Lab Work</option>
              <option value="project">Course Project</option>
              <option value="other">Other Assessment</option>
            </select>
          </div>
          <Input
            label="Date"
            type="date"
            icon={Calendar}
            value={formData.date}
            onChange={(e) => setFormData((prev) => ({ ...prev, date: e.target.value }))}
          />
        </div>

        <div className="grid grid-cols-1 xs:grid-cols-3 sm:grid-cols-3 gap-3">
          <Input
            label="Marks Scored"
            type="number"
            step="0.5"
            min="0"
            placeholder="e.g. 85"
            value={formData.score}
            onChange={(e) => setFormData((prev) => ({ ...prev, score: e.target.value }))}
            required
          />
          <Input
            label="Total Marks"
            type="number"
            step="0.5"
            min="1"
            placeholder="e.g. 100"
            value={formData.totalMarks}
            onChange={(e) => setFormData((prev) => ({ ...prev, totalMarks: e.target.value }))}
            required
          />
          <Input
            label="Weightage %"
            type="number"
            min="0"
            max="100"
            icon={Percent}
            placeholder="e.g. 25"
            value={formData.weightage}
            onChange={(e) => setFormData((prev) => ({ ...prev, weightage: e.target.value }))}
          />
        </div>

        {calculatedPct !== null && (
          <div className="flex items-center justify-between px-3 py-2 rounded-xl bg-raised border border-border text-xs">
            <span className="text-text-muted">Calculated Percentage:</span>
            <span
              className={`font-bold font-mono ${
                calculatedPct >= 75
                  ? 'text-emerald-400'
                  : calculatedPct >= 50
                  ? 'text-amber-400'
                  : 'text-rose-400'
              }`}
            >
              {calculatedPct}%
            </span>
          </div>
        )}

        <div>
          <label className="mb-1.5 block text-xs font-medium text-text-secondary">
            Remarks & AI Advisor Notes <span className="text-text-muted">(Optional)</span>
          </label>
          <textarea
            rows={2}
            placeholder="e.g. Did well on conceptual questions, need more practice on implementation questions"
            value={formData.remarks}
            onChange={(e) => setFormData((prev) => ({ ...prev, remarks: e.target.value }))}
            className="input text-xs w-full resize-none font-sans"
          />
        </div>

        <div className="flex items-center justify-end gap-3 pt-3 border-t border-border">
          <Button type="button" variant="ghost" onClick={onClose} disabled={isLoading}>
            Cancel
          </Button>
          <Button type="submit" variant="primary" loading={isLoading}>
            Save Record
          </Button>
        </div>
      </form>
    </Modal>
  )
}
