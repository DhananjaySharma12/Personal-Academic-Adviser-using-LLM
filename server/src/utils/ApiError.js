/**
 * ApiError — custom error class for consistent HTTP error responses.
 * Use: throw new ApiError(404, 'NOT_FOUND', 'Subject not found')
 */
export class ApiError extends Error {
  constructor(status = 500, code = 'INTERNAL_ERROR', message = 'An unexpected error occurred') {
    super(message)
    this.status = status
    this.code = code
  }
}

/** Shorthand factories */
export const notFound = (msg = 'Resource not found') => new ApiError(404, 'NOT_FOUND', msg)
export const forbidden = (msg = 'Access denied') => new ApiError(403, 'FORBIDDEN', msg)
export const unauthorized = (msg = 'Authentication required') =>
  new ApiError(401, 'UNAUTHORIZED', msg)
export const badRequest = (msg = 'Bad request') => new ApiError(400, 'BAD_REQUEST', msg)
export const conflict = (msg = 'Conflict') => new ApiError(409, 'CONFLICT', msg)
