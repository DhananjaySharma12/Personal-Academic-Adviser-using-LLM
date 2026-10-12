/**
 * Skeleton — loading placeholder with shimmer animation.
 */
export default function Skeleton({ className = '', variant = 'rect' }) {
  const base =
    'animate-pulse bg-raised relative overflow-hidden after:absolute after:inset-0 after:bg-gradient-to-r after:from-transparent after:via-white/[0.04] after:to-transparent after:animate-[shimmer_1.5s_infinite]'

  if (variant === 'circle') {
    return <div className={`${base} rounded-full ${className}`} aria-hidden="true" />
  }
  if (variant === 'text') {
    return <div className={`${base} h-4 rounded ${className}`} aria-hidden="true" />
  }
  return <div className={`${base} rounded-card ${className}`} aria-hidden="true" />
}

// StatCard skeleton convenience wrapper
export function SkeletonCard() {
  return (
    <div className="card space-y-3">
      <Skeleton variant="text" className="w-1/3" />
      <Skeleton variant="text" className="w-1/2 h-8" />
      <Skeleton variant="text" className="w-2/3" />
    </div>
  )
}
