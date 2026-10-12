/**
 * authenticate.js — JWT middleware. Reads Bearer token from Authorization header.
 * Sets req.user = { id, email, role } on success.
 * Never trusts userId from request body/params.
 */
import { verifyToken } from '../utils/jwt.js'
import { unauthorized } from '../utils/ApiError.js'
import User from '../models/User.js'

export async function authenticate(req, _res, next) {
  try {
    const header = req.headers.authorization
    if (!header || !header.startsWith('Bearer ')) {
      throw unauthorized('No token provided')
    }

    const token = header.slice(7)
    const payload = verifyToken(token)

    // Load minimal user data; verify user still exists
    const user = await User.findById(payload.sub).select('_id email role')
    if (!user) throw unauthorized('User no longer exists')

    req.user = { id: user._id.toString(), email: user.email, role: user.role }
    next()
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
