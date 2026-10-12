/**
 * jwt.js — helpers for signing and verifying JWTs.
 * Uses env vars only; no hardcoded secrets.
 */
import jwt from 'jsonwebtoken'
import { env } from '../config/env.js'
import { unauthorized } from './ApiError.js'

/** Sign a token for the given userId */
export const signToken = (userId) =>
  jwt.sign({ sub: userId }, env.JWT_SECRET, { expiresIn: env.JWT_EXPIRES_IN })

/** Verify token and return decoded payload; throws ApiError on failure */
export const verifyToken = (token) => {
  try {
    return jwt.verify(token, env.JWT_SECRET)
  } catch {
    throw unauthorized('Invalid or expired token')
  }
}
