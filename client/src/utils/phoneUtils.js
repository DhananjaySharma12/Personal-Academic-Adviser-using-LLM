/**
 * phoneUtils.js — Helper utilities for phone authentication:
 * - Country codes catalogue (default +91)
 * - E.164 validation
 * - Phone masking for privacy (e.g. +91 98••••••12)
 */

export const COUNTRY_CODES = [
  { code: 'IN', dialCode: '+91', name: 'India', flag: '🇮🇳' },
  { code: 'US', dialCode: '+1', name: 'United States', flag: '🇺🇸' },
  { code: 'CA', dialCode: '+1', name: 'Canada', flag: '🇨🇦' },
  { code: 'GB', dialCode: '+44', name: 'United Kingdom', flag: '🇬🇧' },
  { code: 'AE', dialCode: '+971', name: 'United Arab Emirates', flag: '🇦🇪' },
  { code: 'AU', dialCode: '+61', name: 'Australia', flag: '🇦🇺' },
  { code: 'SG', dialCode: '+65', name: 'Singapore', flag: '🇸🇬' },
  { code: 'DE', dialCode: '+49', name: 'Germany', flag: '🇩🇪' },
  { code: 'FR', dialCode: '+33', name: 'France', flag: '🇫🇷' },
  { code: 'JP', dialCode: '+81', name: 'Japan', flag: '🇯🇵' },
  { code: 'SA', dialCode: '+966', name: 'Saudi Arabia', flag: '🇸🇦' },
  { code: 'MY', dialCode: '+60', name: 'Malaysia', flag: '🇲🇾' },
  { code: 'NZ', dialCode: '+64', name: 'New Zealand', flag: '🇳🇿' },
]

/**
 * Validates E.164 format: + followed by 8 to 15 digits.
 */
export function isValidE164(phone) {
  if (!phone || typeof phone !== 'string') return false
  const clean = phone.trim()
  return /^\+[1-9]\d{7,14}$/.test(clean)
}

/**
 * Normalizes country code and national number to E.164 format.
 */
export function formatToE164(dialCode, nationalNumber) {
  const cleanDial = dialCode.startsWith('+') ? dialCode : `+${dialCode}`
  // Strip leading 0 and any non-digits
  const cleanNational = (nationalNumber || '').replace(/\D/g, '').replace(/^0+/, '')
  return `${cleanDial}${cleanNational}`
}

/**
 * Masks a phone number for UI display (e.g. +91 98••••••12)
 */
export function maskPhoneNumber(phone) {
  if (!phone) return ''
  const clean = phone.trim()

  // Match: country code (e.g. +91) and the rest of the digits
  const match = clean.match(/^(\+\d{1,4})\s*(\d+)$/)
  if (!match) {
    if (clean.length > 4) {
      return `${clean.slice(0, 2)}••••••${clean.slice(-2)}`
    }
    return clean
  }

  const [, countryCode, digits] = match
  if (digits.length <= 4) {
    return `${countryCode} ${digits}`
  }

  const firstTwo = digits.slice(0, 2)
  const lastTwo = digits.slice(-2)
  const maskCount = Math.max(4, digits.length - 4)
  const maskedMiddle = '•'.repeat(maskCount)

  return `${countryCode} ${firstTwo}${maskedMiddle}${lastTwo}`
}

/**
 * Checks if an email address is synthetic (created for phone-only or internal provider accounts).
 */
export function isSyntheticEmail(email) {
  if (!email || typeof email !== 'string') return false
  return email.endsWith('@phone.user') || email.endsWith('@firebase.user')
}

/**
 * Returns a display name that never falls back to a synthetic email.
 */
export function getSafeDisplayName(user, profile, fallback = 'Student') {
  if (profile?.displayName && profile.displayName.trim()) {
    return profile.displayName.trim()
  }
  if (user?.displayName && user.displayName.trim()) {
    return user.displayName.trim()
  }
  if (user?.email && !isSyntheticEmail(user.email)) {
    const part = user.email.split('@')[0]
    if (part) return part
  }
  return fallback
}

/**
 * Returns a safe identifier (real email, or masked/formatted phone number).
 */
export function getSafeUserIdentifier(user, profile) {
  if (user?.email && !isSyntheticEmail(user.email)) {
    return user.email
  }
  if (profile?.phoneNumber) {
    return profile.phoneNumber
  }
  if (user?.phoneNumber) {
    return user.phoneNumber
  }
  return ''
}

