/**
 * validate.js — Zod validation middleware factory.
 * Usage: router.post('/path', validate(schema), controller)
 * Validates req.body. For params/query, use validateParams/validateQuery.
 */
import { ZodError } from 'zod'

/** Formats Zod issues into a human-readable string */
function formatZodError(error) {
  return error.issues.map((i) => `${i.path.join('.')}: ${i.message}`).join('; ')
}

export function validate(schema) {
  return (req, _res, next) => {
    try {
      req.body = schema.parse(req.body)
      next()
    } catch (err) {
      if (err instanceof ZodError) {
        return next({ status: 422, code: 'VALIDATION_ERROR', message: formatZodError(err) })
      }
      next(err)
    }
  }
}

export function validateQuery(schema) {
  return (req, _res, next) => {
    try {
      req.query = schema.parse(req.query)
      next()
    } catch (err) {
      if (err instanceof ZodError) {
        return next({ status: 422, code: 'VALIDATION_ERROR', message: formatZodError(err) })
      }
      next(err)
    }
  }
}
