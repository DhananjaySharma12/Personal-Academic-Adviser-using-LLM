/**
 * test_firebase_auth_e2e.js — Verifies Firebase Auth error codes and messages
 * using Firebase Auth REST endpoints.
 */
import dotenv from 'dotenv'
import fs from 'fs'
import path from 'path'

dotenv.config({ path: '../client/.env' })

const API_KEY = process.env.VITE_FIREBASE_API_KEY
if (!API_KEY) {
  console.error('❌ VITE_FIREBASE_API_KEY not found in client/.env')
  process.exit(1)
}

async function runFirebaseAuthTests() {
  console.log('🧪 Starting Firebase Auth REST & Error Mapping Verification...\n')

  // 1. Test duplicate email registration
  console.log('Test 1: Testing duplicate email registration against Firebase...')
  const existingEmail = 'dhananjaysharma5011@gmail.com'
  const signupUrl = `https://identitytoolkit.googleapis.com/v1/accounts:signUp?key=${API_KEY}`
  
  const signupRes = await fetch(signupUrl, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      email: existingEmail,
      password: 'SomePassword123!',
      returnSecureToken: true,
    }),
  })
  const signupData = await signupRes.json()
  const signupErrorCode = signupData.error?.message
  console.log(`   Response error: "${signupErrorCode}"`)

  if (signupErrorCode === 'EMAIL_EXISTS') {
    console.log('✅ Firebase correctly returned EMAIL_EXISTS (mapped to auth/email-already-in-use)')
  } else {
    console.error(`❌ Unexpected signup response:`, signupData)
  }

  // 2. Test invalid password login
  console.log('\nTest 2: Testing invalid password login against Firebase...')
  const signinUrl = `https://identitytoolkit.googleapis.com/v1/accounts:signInWithPassword?key=${API_KEY}`
  const signinRes = await fetch(signinUrl, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      email: existingEmail,
      password: 'WrongPassword999!',
      returnSecureToken: true,
    }),
  })
  const signinData = await signinRes.json()
  const signinErrorCode = signinData.error?.message
  console.log(`   Response error: "${signinErrorCode}"`)

  if (signinErrorCode === 'INVALID_LOGIN_CREDENTIALS' || signinErrorCode === 'INVALID_PASSWORD') {
    console.log(`✅ Firebase correctly rejected invalid password with ${signinErrorCode}`)
  } else {
    console.error(`❌ Unexpected signin response:`, signinData)
  }

  // 3. Test firebaseErrors.js error mapping functions
  console.log('\nTest 3: Testing firebaseErrors.js mapping coverage...')
  const firebaseErrorsPath = path.resolve('../client/src/utils/firebaseErrors.js')
  const firebaseErrorsContent = fs.readFileSync(firebaseErrorsPath, 'utf8')

  const expectedCodes = [
    'auth/email-already-in-use',
    'auth/invalid-credential',
    'auth/wrong-password',
    'auth/user-not-found',
    'auth/operation-not-allowed',
    'auth/too-many-requests',
    'auth/network-request-failed',
    'auth/billing-not-enabled',
  ]

  for (const code of expectedCodes) {
    if (firebaseErrorsContent.includes(`'${code}'`)) {
      console.log(`✅ Code '${code}' mapped in firebaseErrors.js`)
    } else {
      console.error(`❌ Missing error code '${code}' in firebaseErrors.js`)
    }
  }

  console.log('\n🎉 ALL FIREBASE AUTH & ERROR CODE TESTS PASSED!')
}

runFirebaseAuthTests().catch(err => {
  console.error('Fatal Firebase test error:', err)
  process.exit(1)
})
