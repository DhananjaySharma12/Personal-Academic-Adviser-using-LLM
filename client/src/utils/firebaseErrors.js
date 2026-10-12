export function getFirebaseAuthErrorMessage(error) {
  const code = error?.code || ''
  switch (code) {
    case 'auth/email-already-in-use':
      return 'This email is already registered. Please sign in.'
    case 'auth/invalid-credential':
    case 'auth/wrong-password':
    case 'auth/user-not-found':
      return 'Invalid email or password.'
    case 'auth/weak-password':
      return 'Password must be at least 6 characters.'
    case 'auth/invalid-email':
      return 'Please enter a valid email.'
    case 'auth/popup-closed-by-user':
      return 'Google sign-in was cancelled.'
    case 'auth/too-many-requests':
      return 'Too many attempts. Try again later.'
    case 'auth/network-request-failed':
      return 'Network error. Check your connection.'
    default:
      return 'Something went wrong. Please try again.'
  }
}
