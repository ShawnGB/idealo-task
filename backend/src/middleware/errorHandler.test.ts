import { describe, it, expect, vi } from 'vitest'
import type { Request, Response, NextFunction } from 'express'
import { AppError } from '../lib/AppError.js'
import { errorHandler } from './errorHandler.js'

function mockRes(): Response {
  return {
    status: vi.fn().mockReturnThis(),
    json: vi.fn().mockReturnThis(),
  } as unknown as Response
}

const req = {} as Request
const next = vi.fn() as unknown as NextFunction

describe('errorHandler', () => {
  it('serialises AppError to ApiError JSON with its statusCode', () => {
    const res = mockRes()
    errorHandler(new AppError(404, 'NOT_FOUND', 'Resource not found'), req, res, next)
    expect(res.status).toHaveBeenCalledWith(404)
    expect(res.json).toHaveBeenCalledWith({
      statusCode: 404,
      code: 'NOT_FOUND',
      message: 'Resource not found',
    })
  })

  it('returns 500 INTERNAL_ERROR for unknown errors', () => {
    const res = mockRes()
    errorHandler(new Error('unexpected'), req, res, next)
    expect(res.status).toHaveBeenCalledWith(500)
    expect(res.json).toHaveBeenCalledWith({
      statusCode: 500,
      code: 'INTERNAL_ERROR',
      message: 'Something went wrong',
    })
  })

  it('returns 500 for non-Error thrown values', () => {
    const res = mockRes()
    errorHandler('a string was thrown', req, res, next)
    expect(res.status).toHaveBeenCalledWith(500)
    expect(res.json).toHaveBeenCalledWith({
      statusCode: 500,
      code: 'INTERNAL_ERROR',
      message: 'Something went wrong',
    })
  })
})
