/**
 * OtpInput.jsx — 6-digit segmented OTP input with:
 * - 44px+ touch targets (meets accessibility WCAG standards)
 * - Full paste support (auto-distributes 6 digits)
 * - Auto-focus next on input, backspace to previous
 * - Arrow-key navigation
 * - autocomplete="one-time-code", inputMode="numeric"
 */
import { useRef, useEffect } from 'react'

export default function OtpInput({ value = '', onChange, disabled = false, error = false }) {
  const inputRefs = useRef([])

  // Ensure digits array always has 6 slots
  const digits = Array.from({ length: 6 }, (_, i) => value[i] || '')

  useEffect(() => {
    // Focus first empty box on mount if not disabled
    if (!disabled) {
      const firstEmptyIndex = digits.findIndex((d) => !d)
      const targetIndex = firstEmptyIndex === -1 ? 0 : firstEmptyIndex
      inputRefs.current[targetIndex]?.focus()
    }
  }, [])

  const updateDigit = (index, char) => {
    const newDigits = [...digits]
    newDigits[index] = char
    const combined = newDigits.join('').slice(0, 6)
    onChange(combined)

    if (char && index < 5) {
      inputRefs.current[index + 1]?.focus()
    }
  }

  const handleChange = (e, index) => {
    const inputVal = e.target.value
    // Handle single digit input
    const cleanDigit = inputVal.replace(/\D/g, '').slice(-1)
    updateDigit(index, cleanDigit)
  }

  const handleKeyDown = (e, index) => {
    if (e.key === 'Backspace') {
      if (!digits[index] && index > 0) {
        // If current is empty, backspace into previous box
        inputRefs.current[index - 1]?.focus()
        updateDigit(index - 1, '')
      } else {
        updateDigit(index, '')
      }
    } else if (e.key === 'ArrowLeft' && index > 0) {
      inputRefs.current[index - 1]?.focus()
    } else if (e.key === 'ArrowRight' && index < 5) {
      inputRefs.current[index + 1]?.focus()
    }
  }

  const handlePaste = (e) => {
    e.preventDefault()
    const pastedData = e.clipboardData.getData('text')
    const cleanedDigits = pastedData.replace(/\D/g, '').slice(0, 6)
    if (!cleanedDigits) return

    onChange(cleanedDigits)
    const focusIndex = Math.min(cleanedDigits.length, 5)
    inputRefs.current[focusIndex]?.focus()
  }

  return (
    <div className="flex items-center justify-between gap-1.5 sm:gap-2.5">
      {Array.from({ length: 6 }).map((_, i) => (
        <input
          key={i}
          ref={(el) => (inputRefs.current[i] = el)}
          type="text"
          inputMode="numeric"
          pattern="[0-9]*"
          maxLength={1}
          autoComplete={i === 0 ? 'one-time-code' : 'off'}
          value={digits[i] || ''}
          onChange={(e) => handleChange(e, i)}
          onKeyDown={(e) => handleKeyDown(e, i)}
          onPaste={handlePaste}
          disabled={disabled}
          aria-label={`Digit ${i + 1} of 6`}
          className="min-w-[44px] min-h-[44px] w-11 h-12 sm:w-12 sm:h-14 text-center text-xl font-bold rounded-xl transition-all duration-150 outline-none select-none disabled:opacity-40 disabled:cursor-not-allowed"
          style={{
            background: '#FFFFFF',
            border: error
              ? '2px solid #C0645A'
              : digits[i]
                ? '2px solid #84A282'
                : '1px solid rgba(132, 162, 130, 0.40)',
            color: '#2D3A2C',
            boxShadow: digits[i]
              ? '0 0 10px rgba(132, 162, 130, 0.20)'
              : '0 1px 3px rgba(0, 0, 0, 0.05)',
          }}
          onFocus={(e) => {
            e.target.select()
            e.target.style.borderColor = '#84A282'
            e.target.style.boxShadow = '0 0 0 3px rgba(132, 162, 130, 0.25)'
          }}
          onBlur={(e) => {
            e.target.style.borderColor = error
              ? '#C0645A'
              : digits[i]
                ? '#84A282'
                : 'rgba(132, 162, 130, 0.40)'
            e.target.style.boxShadow = digits[i]
              ? '0 0 10px rgba(132, 162, 130, 0.20)'
              : 'none'
          }}
        />
      ))}
    </div>
  )
}
