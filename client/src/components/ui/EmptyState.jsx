/**
 * EmptyState — shown when a list/section has no data yet.
 */
import { Inbox } from 'lucide-react'
import Button from './Button'

export default function EmptyState({
  icon: Icon = Inbox,
  title = 'Nothing here yet',
  description,
  action,
  actionLabel,
}) {
  return (
    <div className="flex flex-col items-center justify-center py-16 px-6 text-center">
      <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-primary/10">
        <Icon size={26} className="text-primary-soft" />
      </div>
      <h3 className="mb-2 font-display text-lg font-semibold text-text-main">{title}</h3>
      {description && <p className="mb-6 max-w-xs text-sm text-text-secondary">{description}</p>}
      {action && actionLabel && (
        <Button variant="secondary" onClick={action}>
          {actionLabel}
        </Button>
      )}
    </div>
  )
}
