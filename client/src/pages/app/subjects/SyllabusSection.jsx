import { useState } from 'react'
import { CheckCircle2, Circle, Plus, Trash2, BookOpen } from 'lucide-react'
import Button from '@/components/ui/Button'

export default function SyllabusSection({ subject, onToggleTopic, onAddTopic, onDeleteTopic }) {
  const [newTopic, setNewTopic] = useState('')

  const handleAdd = (e) => {
    e?.preventDefault()
    if (!newTopic.trim()) return
    onAddTopic(subject, newTopic.trim())
    setNewTopic('')
  }

  const topics = subject.syllabusTopics || []

  return (
    <div className="space-y-3 pt-3">
      {/* Topics list */}
      {topics.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
          {topics.map((topicItem, idx) => (
            <div
              key={idx}
              className={`group flex items-center justify-between rounded-xl border p-2.5 transition-all ${
                topicItem.completed
                  ? 'border-border/40 bg-surface/30 text-text-muted'
                  : 'border-border/80 bg-raised/70 text-text-main hover:border-primary/40'
              }`}
            >
              <button
                type="button"
                onClick={() => onToggleTopic(subject, idx)}
                className="flex items-center gap-2.5 text-left text-xs min-w-0 flex-1 pr-2"
              >
                {topicItem.completed ? (
                  <CheckCircle2 size={16} className="text-emerald-400 shrink-0" />
                ) : (
                  <Circle size={16} className="text-text-muted shrink-0 group-hover:text-primary-soft transition-colors" />
                )}
                <span
                  className={`truncate ${
                    topicItem.completed ? 'line-through text-text-muted' : 'font-medium'
                  }`}
                >
                  {topicItem.topic}
                </span>
              </button>
              <button
                type="button"
                onClick={() => onDeleteTopic(subject, idx)}
                className="opacity-0 group-hover:opacity-100 text-text-muted hover:text-rose-400 p-1 rounded transition-all shrink-0"
                title="Remove topic"
              >
                <Trash2 size={13} />
              </button>
            </div>
          ))}
        </div>
      ) : (
        <div className="py-6 text-center rounded-xl border border-dashed border-border bg-surface/30">
          <BookOpen size={24} className="mx-auto text-text-muted mb-2 opacity-50" />
          <p className="text-xs text-text-secondary">No syllabus topics added yet.</p>
          <p className="text-[11px] text-text-muted mt-0.5">
            Add key units, chapters, and concepts below to track mastery!
          </p>
        </div>
      )}

      {/* Add Topic Bar — typing here only re-renders this tiny input */}
      <form onSubmit={handleAdd} className="flex items-center gap-2 pt-2">
        <input
          type="text"
          placeholder="Add new topic or chapter (e.g. Unit 3: Dynamic Programming)..."
          value={newTopic}
          onChange={(e) => setNewTopic(e.target.value)}
          className="input text-xs flex-1 bg-raised border-border text-text-main placeholder-text-muted focus:border-primary py-2 px-3"
        />
        <Button
          type="submit"
          variant="secondary"
          size="sm"
          disabled={!newTopic.trim()}
          className="flex items-center gap-1.5 shrink-0"
        >
          <Plus size={14} />
          <span>Add</span>
        </Button>
      </form>
    </div>
  )
}
