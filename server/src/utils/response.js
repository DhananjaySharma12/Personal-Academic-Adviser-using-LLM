/**
 * response.js — standard response helpers.
 * All responses: { success, data } or { success, error: { code, message } }
 */

export const ok = (res, data = null, status = 200) => res.status(status).json({ success: true, data })

export const sendSuccess = (res, status = 200, data = null) => res.status(status).json({ success: true, data })

export const created = (res, data = null) => res.status(201).json({ success: true, data })

export const noContent = (res) => res.status(204).send()

