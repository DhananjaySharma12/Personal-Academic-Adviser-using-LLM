/**
 * Badge — small status pill with semantic variants.
 */
const variants = {
  primary: 'badge-primary',
  success: 'badge-success',
  warning: 'badge-warning',
  danger: 'badge-danger',
  muted: 'inline-flex items-center gap-1 bg-raised text-text-muted text-xs font-medium px-2.5 py-0.5 rounded-full border border-border',
}

export default function Badge({ children, variant = 'primary', className = '' }) {
  return (
    <span className={`${variants[variant]} ${className}`}>
      {children}
    </span>
  )
}
