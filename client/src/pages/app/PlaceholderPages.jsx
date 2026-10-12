/**
 * PlaceholderPages.jsx — temporary stubs.
 * All core app phases (Documents, Analytics, Career) are now fully implemented! ✅
 */
import { Construction } from 'lucide-react'

export function ComingSoonPage({ title }) {
  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center gap-4 text-center">
      <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-elevated/60 border border-border-strong text-accent shadow-glow-xs">
        <Construction size={32} />
      </div>
      <h1 className="font-display text-2xl font-bold text-text-main">{title}</h1>
      <p className="text-sm text-text-muted">This feature is coming soon.</p>
    </div>
  )
}
