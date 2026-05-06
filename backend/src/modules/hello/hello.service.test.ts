import { describe, it, expect } from 'vitest'
import { getHelloMessage } from './hello.service.js'
import { AppError } from '../../lib/AppError.js'

describe('getHelloMessage', () => {
  it('returns default message when no name is given', () => {
    expect(getHelloMessage()).toEqual({ message: 'Hello from Express' })
  })

  it('returns personalised message when name is given', () => {
    expect(getHelloMessage('world')).toEqual({ message: 'Hello, world' })
  })

  it('throws AppError when name is "error"', () => {
    expect(() => getHelloMessage('error')).toThrow(AppError)
  })

  it('thrown AppError has 400 status and VALIDATION_ERROR code', () => {
    expect.assertions(3)
    try {
      getHelloMessage('error')
    } catch (err) {
      expect(err).toBeInstanceOf(AppError)
      const appErr = err as AppError
      expect(appErr.statusCode).toBe(400)
      expect(appErr.code).toBe('VALIDATION_ERROR')
    }
  })
})
