import { useState, useEffect } from 'react'
import Modal from '@/components/ui/Modal'
import Input from '@/components/ui/Input'
import Button from '@/components/ui/Button'
import { BookOpen, Hash, Award, Check } from 'lucide-react'

const COLOR_OPTIONS = [
  '#84A282', // Botanical Sage
  '#B8CFB3', // Laurel Green
  '#5E7A5C', // Forest Sage
  '#E898A5', // Blush Rose
  '#C4956A', // Warm Amber
  '#5E82A6', // Slate Blue
  '#9B7EBD', // Soft Lavender
  '#7A8E79', // Muted Laurel
]

export default function SubjectModal({ isOpen, onClose, onSubmit, editingSubject, isLoading }) {
  const [formData, setFormData] = useState({
    name: '',
    code: '',
    credits: 3,
    color: '#84A282',
    targetGrade: 'A',
    syllabusInput: '',
  })

  useEffect(() => {
    if (editingSubject) {
      setFormData({
        name: editingSubject.name || '',
        code: editingSubject.code || '',
        credits: editingSubject.credits || 3,
        color: editingSubject.color || '#84A282',
        targetGrade: editingSubject.targetGrade || 'A',
        syllabusInput: '',
      })
    } else {
      setFormData({
        name: '',
        code: '',
        credits: 3,
        color: '#84A282',
        targetGrade: 'A',
        syllabusInput: '',
      })
    }
  }, [editingSubject, isOpen])

  const handleSubmit = (e) => {
    e.preventDefault()
    if (!formData.name.trim()) return

    const payload = {
      name: formData.name.trim(),
      code: formData.code.trim().toUpperCase(),
      credits: Number(formData.credits) || 3,
      color: formData.color,
      targetGrade: formData.targetGrade.trim() || 'A',
    }

    if (!editingSubject && formData.syllabusInput.trim()) {
      payload.syllabusTopics = formData.syllabusInput
        .split('\n')
        .map((t) => t.trim())
        .filter(Boolean)
        .map((topic) => ({ topic, completed: false }))
    }

    onSubmit(payload)
  }

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={editingSubject ? 'Edit Subject' : 'Add New Subject'}
      size="md"
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        <Input
          label="Course / Subject Name"
          placeholder="e.g. Data Structures & Algorithms"
          icon={BookOpen}
          value={formData.name}
          onChange={(e) => setFormData((prev) => ({ ...prev, name: e.target.value }))}
          required
          autoFocus
        />

        <div className="grid grid-cols-2 gap-3">
          <Input
            label="Course Code (Optional)"
            placeholder="e.g. CS201"
            icon={Hash}
            value={formData.code}
            onChange={(e) => setFormData((prev) => ({ ...prev, code: e.target.value }))}
          />
          <Input
            label="Credits"
            type="number"
            min="0"
            max="30"
            value={formData.credits}
            onChange={(e) => setFormData((prev) => ({ ...prev, credits: e.target.value }))}
          />
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="mb-1.5 block text-xs font-medium text-text-secondary">
              Target Grade
            </label>
            <div className="relative">
              <select
                value={formData.targetGrade}
                onChange={(e) => setFormData((prev) => ({ ...prev, targetGrade: e.target.value }))}
                className="input text-xs w-full bg-raised border-border text-text-main appearance-none pr-8 cursor-pointer"
              >
                <option value="O">O (Outstanding / 10)</option>
                <option value="A+">A+ (Superior / 9)</option>
                <option value="A">A (Excellent / 8)</option>
                <option value="B+">B+ (Very Good / 7)</option>
                <option value="B">B (Good / 6)</option>
                <option value="C">C (Average / 5)</option>
                <option value="P">P (Pass)</option>
              </select>
              <Award size={14} className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-text-muted" />
            </div>
          </div>

          <div>
            <label className="mb-1.5 block text-xs font-medium text-text-secondary">
              Theme Accent Color
            </label>
            <div className="flex items-center gap-2 pt-1 flex-wrap">
              {COLOR_OPTIONS.map((c) => (
                <button
                  key={c}
                  type="button"
                  onClick={() => setFormData((prev) => ({ ...prev, color: c }))}
                  className={`h-6 w-6 rounded-full flex items-center justify-center transition-all ${
                    formData.color === c
                      ? 'scale-110 ring-2 ring-white ring-offset-2 ring-offset-bg shadow-sm'
                      : 'opacity-70 hover:opacity-100 hover:scale-105'
                  }`}
                  style={{ backgroundColor: c }}
                  aria-label={`Color ${c}`}
                >
                  {formData.color === c && <Check size={11} className="text-white drop-shadow" />}
                </button>
              ))}
            </div>
          </div>
        </div>

        {!editingSubject && (
          <div>
            <label className="mb-1.5 block text-xs font-medium text-text-secondary">
              Syllabus Topics <span className="text-text-muted">(Optional — one topic per line)</span>
            </label>
            <textarea
              rows={4}
              placeholder="Unit 1: Arrays and Linked Lists&#10;Unit 2: Stacks and Queues&#10;Unit 3: Trees and Binary Search&#10;Unit 4: Graph Algorithms"
              value={formData.syllabusInput}
              onChange={(e) => setFormData((prev) => ({ ...prev, syllabusInput: e.target.value }))}
              className="input text-xs w-full min-h-[90px] resize-none font-sans"
            />
            <p className="mt-1 text-[11px] text-text-muted">
              You can also manage or add chapters individually at any time from the subject card.
            </p>
          </div>
        )}

        <div className="flex items-center justify-end gap-3 pt-3 border-t border-border">
          <Button type="button" variant="ghost" onClick={onClose} disabled={isLoading}>
            Cancel
          </Button>
          <Button type="submit" variant="primary" loading={isLoading}>
            {editingSubject ? 'Save Changes' : 'Create Subject'}
          </Button>
        </div>
      </form>
    </Modal>
  )
}
