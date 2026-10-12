/**
 * StatCard — metric card for dashboard with icon, value, label, and optional trend.
 */
import { TrendingUp, TrendingDown, Minus } from 'lucide-react'

export default function StatCard({ label, value, icon: Icon, trend, trendLabel, color = 'primary' }) {
  const colorMap = {
    primary: 'bg-primary/10 text-primary-soft',
    success: 'bg-success/10 text-success',
    warning: 'bg-warning/10 text-warning',
    danger: 'bg-danger/10 text-danger',
  }

  const TrendIcon = trend === 'up' ? TrendingUp : trend === 'down' ? TrendingDown : Minus
  const trendColor =
    trend === 'up' ? 'text-success' : trend === 'down' ? 'text-danger' : 'text-text-muted'

  return (
    <div className="card flex flex-col gap-4">
      <div className="flex items-start justify-between">
        <div className={`flex h-10 w-10 items-center justify-center rounded-xl ${colorMap[color]}`}>
          <Icon size={20} />
        </div>
        {trend && (
          <span className={`flex items-center gap-1 text-xs font-medium ${trendColor}`}>
            <TrendIcon size={13} />
            {trendLabel}
          </span>
        )}
      </div>
      <div>
        <p className="text-2xl font-bold text-text-main">{value}</p>
        <p className="mt-0.5 text-sm text-text-secondary">{label}</p>
      </div>
    </div>
  )
}
