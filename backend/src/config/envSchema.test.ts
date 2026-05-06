import { describe, it, expect } from 'vitest'
import { envSchema } from './envSchema.js'

describe('envSchema', () => {
  it('defaults PORT to 3001 when not set', () => {
    const result = envSchema.parse({})
    expect(result.PORT).toBe(3001)
  })

  it('coerces PORT from string to number', () => {
    const result = envSchema.parse({ PORT: '4000' })
    expect(result.PORT).toBe(4000)
  })

  it('throws on non-numeric PORT', () => {
    expect(() => envSchema.parse({ PORT: 'not-a-number' })).toThrow()
  })
})
