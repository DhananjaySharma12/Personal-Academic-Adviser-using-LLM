/**
 * authenticate.js — Authentication middleware.
 * Supports both custom JWTs and Firebase ID tokens.
 * Sets req.user = { id, email, role } on success.
 */
import jwt from 'jsonwebtoken'
import { verifyToken } from '../utils/jwt.js'
import User from '../models/User.js'
import StudentProfile from '../models/StudentProfile.js'

export async function authenticate(req, _res, next) {
  try {
    const header = req.headers.authorization
    if (!header || !header.startsWith('Bearer ')) {
      return next({ status: 401, code: 'UNAUTHORIZED', message: 'No token provided' })
    }

    const token = header.slice(7)

    // 1. First, attempt to verify using internal JWT
    try {
      const payload = verifyToken(token)
      if (payload?.sub) {
        const user = await User.findById(payload.sub).select('_id email role')
        if (user) {
          req.user = { id: user._id.toString(), email: user.email, role: user.role }
          return next()
        }
      }
    } catch {
      // Not an internal secret JWT, check if it is a Firebase token
    }

    // 2. Decode Firebase ID token payload
    const decoded = jwt.decode(token)
    if (decoded && (decoded.iss?.includes('securetoken.google.com') || decoded.aud || decoded.user_id || decoded.sub)) {
      const phoneNumber = decoded.phone_number || ''
      const email =
        decoded.email ||
        (phoneNumber
          ? `${phoneNumber.replace(/[^0-9]/g, '')}@phone.user`
          : `${decoded.sub || decoded.user_id}@firebase.user`)
      const displayName =
        decoded.name || decoded.displayName || (phoneNumber ? `Student ${phoneNumber.slice(-4)}` : 'Student')

      // Find or create local user record for this Firebase user to maintain data consistency
      let user = await User.findOne({ email })
      if (!user) {
        user = await User.create({
          email,
          passwordHash: 'firebase_authenticated_user',
          role: 'student',
        })
        await StudentProfile.create({
          userId: user._id,
          displayName,
          phoneNumber,
          onboardingComplete: false,
        })
      } else if (phoneNumber) {
        // If profile exists and phoneNumber is empty, update it
        await StudentProfile.updateOne(
          { userId: user._id, phoneNumber: { $in: ['', null] } },
          { $set: { phoneNumber } },
        )
      }

      req.user = { id: user._id.toString(), email: user.email, role: user.role }
      return next()
    }

    // Fallback: If token cannot be decoded, return 401
    return next({ status: 401, code: 'UNAUTHORIZED', message: 'Invalid or expired token' })
  } catch (err) {
    next(err)
  }
}

/** Require admin role */
export function requireAdmin(req, _res, next) {
  if (req.user?.role !== 'admin') {
    return next({ status: 403, code: 'FORBIDDEN', message: 'Admin access required' })
  }
  next()
}
