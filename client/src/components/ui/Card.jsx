/**
 * Card — base surface component with optional hover glow.
 */
import { motion } from 'framer-motion'

export default function Card({ children, className = '', hover = false, raised = false, ...props }) {
  return (
    <motion.div
      whileHover={hover ? { y: -2, boxShadow: '0 0 24px rgba(225,220,201,0.12)' } : undefined}
      transition={{ duration: 0.2 }}
      className={`${raised ? 'card-raised' : 'card'} ${className}`}
      {...props}
    >
      {children}
    </motion.div>
  )
}
