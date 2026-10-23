export function getFirebaseAuthErrorMessage(error) {
  const code = error?.code || ''

  // DEV-ONLY: log the exact Firebase error code so configuration issues
  // (e.g. Email/Password not enabled in Firebase Console) are immediately
  // visible in DevTools. Stripped out in production builds.
  if (import.meta.env.DEV) {
    console.warn('[Firebase Auth] error code:', code, '| message:', error?.message)
  }

  switch (code) {
    // ── Account / credential errors ────────────────────────────────────
    case 'auth/email-already-in-use':
      return 'This email is already registered. Please sign in instead.'
    case 'auth/invalid-credential':
    case 'auth/wrong-password':
    case 'auth/user-not-found':
      return 'Invalid email or password.'
    case 'auth/invalid-email':
      return 'Please enter a valid email address.'
    case 'auth/missing-email':
      return 'An email address is required.'
    case 'auth/missing-password':
      return 'A password is required.'

    // ── Password strength ──────────────────────────────────────────────
    case 'auth/weak-password':
      return 'Password must be at least 6 characters.'

    // ── Firebase project / configuration errors ───────────────────────
    // These appear when Email/Password auth is not enabled in Firebase
    // Console, or when the Firebase project is misconfigured.
    case 'auth/operation-not-allowed':
      return 'Email/password sign-in is not enabled. Please contact support.'
    case 'auth/configuration-not-found':
      return 'Authentication is not configured. Please contact support.'
    case 'auth/internal-error':
      return 'An internal authentication error occurred. Please try again.'
    case 'auth/admin-restricted-operation':
      return 'This operation is not permitted. Please contact support.'

    // ── API key / app errors ───────────────────────────────────────────
    case 'auth/api-key-not-valid':
    case 'auth/invalid-api-key':
      return 'Authentication configuration error. Please contact support.'
    case 'auth/app-deleted':
    case 'auth/app-not-authorized':
      return 'App authentication error. Please contact support.'

    // ── Session / token errors ─────────────────────────────────────────
    case 'auth/user-disabled':
      return 'This account has been disabled. Please contact support.'
    case 'auth/user-token-expired':
    case 'auth/invalid-user-token':
      return 'Your session has expired. Please sign in again.'
    case 'auth/requires-recent-login':
      return 'Please sign in again to complete this action.'

    // ── Network ───────────────────────────────────────────────────────
    case 'auth/network-request-failed':
      return 'Network error. Please check your connection and try again.'

    // ── Rate limiting ─────────────────────────────────────────────────
    case 'auth/too-many-requests':
      return 'Too many attempts. Please wait a moment and try again.'

    // ── Google / popup errors ─────────────────────────────────────────
    case 'auth/popup-closed-by-user':
    case 'auth/cancelled-popup-request':
      return 'Google sign-in was cancelled.'
    case 'auth/popup-blocked':
      return 'Pop-up was blocked by your browser. Please allow pop-ups and try again.'
    case 'auth/unauthorized-domain':
      return 'This domain is not authorised for sign-in. Please contact support.'

    // ── Account linking / credential errors ───────────────────────────
    case 'auth/credential-already-in-use':
      return 'This credential is already linked to a different account.'
    case 'auth/account-exists-with-different-credential':
      return 'An account already exists with this email using a different sign-in method.'
    case 'auth/email-change-needs-verification':
      return 'Please verify your new email address before signing in.'

    // ── Phone Authentication errors ──────────────────────────────────
    case 'auth/invalid-phone-number':
      return 'Please enter a valid phone number with country code.'
    case 'auth/missing-phone-number':
      return 'Please enter your phone number.'
    case 'auth/invalid-verification-code':
      return 'Incorrect verification code. Please check and try again.'
    case 'auth/code-expired':
      return 'Verification code has expired. Please request a new code.'
    case 'auth/missing-verification-code':
      return 'Please enter the 6-digit verification code.'
    case 'auth/missing-verification-id':
      return 'Verification session expired. Please request a new code.'
    case 'auth/provider-already-linked':
      return 'This phone number is already linked to your account.'
    case 'auth/billing-not-enabled':
      return 'SMS service requires project billing. Please use a configured test phone number.'

    // ── Quota / service errors ────────────────────────────────────────
    case 'auth/quota-exceeded':
      return 'Authentication quota exceeded. Please try again later.'
    case 'auth/captcha-check-failed':
      return 'reCAPTCHA verification failed. Please refresh the page and try again.'

    // ── Fallback ──────────────────────────────────────────────────────
    default:
      // DEV: reveal the raw Firebase code so we can identify gaps immediately.
      // Production users see a generic message.
      if (import.meta.env.DEV && code) {
        return `Something went wrong [${code}]. Check the browser console for details.`
      }
      return 'Something went wrong. Please try again.'
  }
}
