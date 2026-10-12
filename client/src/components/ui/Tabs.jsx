/**
 * Tabs — horizontal tab bar with active indicator.
 */
import { motion } from 'framer-motion'

export default function Tabs({ tabs, active, onChange, className = '' }) {
  return (
    <div className={`flex gap-1 border-b border-border ${className}`} role="tablist">
      {tabs.map((tab) => (
        <button
          key={tab.value}
          role="tab"
          aria-selected={active === tab.value}
          onClick={() => onChange(tab.value)}
          className={`relative px-4 py-2.5 text-sm font-medium transition-colors duration-150 ${
            active === tab.value
              ? 'text-text-main'
              : 'text-text-muted hover:text-text-secondary'
          }`}
        >
          {tab.label}
          {active === tab.value && (
            <motion.span
              layoutId="tab-indicator"
              className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary rounded-full"
            />
          )}
        </button>
      ))}
    </div>
  )
}
