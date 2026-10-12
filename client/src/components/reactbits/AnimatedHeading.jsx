/**
 * AnimatedHeading — cycles through words with a smooth fade+slide animation.
 * Used in the landing hero to highlight rotating keywords.
 */
import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'

export default function AnimatedHeading({ staticText, words, className = '' }) {
  const [index, setIndex] = useState(0)

  useEffect(() => {
    const id = setInterval(() => {
      setIndex((i) => (i + 1) % words.length)
    }, 2800)
    return () => clearInterval(id)
  }, [words.length])

  return (
    <span className={className}>
      {staticText}{' '}
      <span className="relative inline-flex overflow-hidden">
        <AnimatePresence mode="wait">
          <motion.span
            key={words[index]}
            className="text-primary-soft"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.35, ease: 'easeOut' }}
          >
            {words[index]}
          </motion.span>
        </AnimatePresence>
      </span>
    </span>
  )
}
