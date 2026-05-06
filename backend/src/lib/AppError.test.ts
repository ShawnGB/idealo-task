import { describe, it, expect } from 'vitest'
import { AppError } from './AppError.js'

describe('AppError', () => {
  it('sets statusCode, code, and message', () => {
    const err = new AppError(404, 'NOT_FOUND', 'Resource not found')
    expect(err.statusCode).toBe(404)
    expect(err.code).toBe('NOT_FOUND')
    expect(err.message).toBe('Resource not found')
  })

  it('is an instance of Error', () => {
    const err = new AppError(500, 'INTERNAL_ERROR', 'Something went wrong')
    expect(err).toBeInstanceOf(Error)
  })

  it('has name AppError', () => {
    const err = new AppError(400, 'VALIDATION_ERROR', 'Bad input')
    expect(err.name).toBe('AppError')
  })
})
