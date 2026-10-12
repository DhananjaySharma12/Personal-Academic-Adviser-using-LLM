/**
 * ErrorState — shown when an API call fails.
 */
import { AlertTriangle } from 'lucide-react'
import Button from './Button'

export default function ErrorState({
  title = 'Something went wrong',
  message,
  onRetry,
}) {
  return (
    <div className="flex flex-col items-center justify-center py-16 px-6 text-center">
      <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-danger/10">
        <AlertTriangle size={26} className="text-danger" />
      </div>
      <h3 className="mb-2 font-display text-lg font-semibold text-text-main">{title}</h3>
      {message && <p className="mb-6 max-w-xs text-sm text-text-secondary">{message}</p>}
      {onRetry && (
        <Button variant="secondary" onClick={onRetry}>
          Try again
        </Button>
      )}
    </div>
  )
}
