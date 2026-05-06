import { describe, it, expect, vi } from 'vitest'
import type { Request, Response, NextFunction } from 'express'
import { AppError } from '../lib/AppError.js'
import { notFound } from './notFound.js'

describe('notFound', () => {
  it('calls next with a 404 NOT_FOUND AppError', () => {
    const next = vi.fn()
    notFound({} as Request, {} as Response, next as unknown as NextFunction)
    expect(next).toHaveBeenCalledOnce()
    const err = next.mock.calls[0][0] as AppError
    expect(err).toBeInstanceOf(AppError)
    expect(err.statusCode).toBe(404)
    expect(err.code).toBe('NOT_FOUND')
    expect(err.message).toBe('Not found')
  })
})
