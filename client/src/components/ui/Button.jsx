/**
 * Button — primary, secondary, ghost, danger variants.
 * All variants use design tokens (no default Tailwind blue).
 */
import { motion } from 'framer-motion'

const variants = {
  primary: 'btn-primary',
  secondary: 'btn-secondary',
  ghost: 'btn-ghost',
  danger:
    'bg-danger/15 hover:bg-danger/25 text-danger border border-danger/30 font-medium px-5 py-2.5 rounded-btn transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed',
}

const sizes = {
  sm: 'text-sm px-3 py-1.5',
  md: '',
  lg: 'text-base px-7 py-3',
}

export default function Button({
  children,
  variant = 'primary',
  size = 'md',
  isLoading = false,
  loading = false,
  icon: Icon,
  className = '',
  ...props
}) {
  const isBusy = Boolean(isLoading || loading)
  return (
    <motion.button
      whileTap={{ scale: 0.97 }}
      className={`inline-flex items-center justify-center gap-2 ${variants[variant]} ${sizes[size]} ${className}`}
      disabled={isBusy || props.disabled}
      {...props}
    >
      {isBusy ? (
        <span className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
      ) : Icon ? (
        <Icon size={16} />
      ) : null}
      {children}
    </motion.button>
  )
}
