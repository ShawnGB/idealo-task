import { describe, it, expect, vi, afterEach } from 'vitest'
import { fetchApi } from './api'
import { isApiError } from './errors'

afterEach(() => {
  vi.restoreAllMocks()
})

describe('fetchApi', () => {
  it('returns data on a successful response', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ message: 'Hello from Express' }),
    }))
    const result = await fetchApi<{ message: string }>('/api/hello')
    expect(result).toEqual({ data: { message: 'Hello from Express' }, error: null })
  })

  it('returns ApiError when response is not ok and body is valid', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({
      ok: false,
      status: 404,
      json: async () => ({ message: 'Not found', code: 'NOT_FOUND', statusCode: 404 }),
    }))
    const result = await fetchApi('/api/missing')
    expect(result).toEqual({
      data: null,
      error: { message: 'Not found', code: 'NOT_FOUND', statusCode: 404 },
    })
  })

  it('returns generic error when response body is unparseable', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({
      ok: false,
      status: 503,
      json: async () => { throw new Error('not json') },
    }))
    const result = await fetchApi('/api/hello')
    expect(result).toEqual({
      data: null,
      error: { message: 'Unexpected error', code: 'UNKNOWN', statusCode: 503 },
    })
  })

  it('returns generic error when response body lacks ApiError shape', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({
      ok: false,
      status: 502,
      json: async () => '<html>Bad Gateway</html>',
    }))
    const result = await fetchApi('/api/hello')
    expect(result).toEqual({
      data: null,
      error: { message: 'Unexpected error', code: 'UNKNOWN', statusCode: 502 },
    })
  })

  it('returns network error when fetch rejects', async () => {
    vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new Error('Failed to fetch')))
    const result = await fetchApi('/api/hello')
    expect(result).toEqual({
      data: null,
      error: { message: 'Network error', code: 'UNKNOWN', statusCode: 0 },
    })
  })
})

describe('isApiError', () => {
  it('returns true for a valid ApiError shape', () => {
    expect(isApiError({ message: 'oops', code: 'NOT_FOUND', statusCode: 404 })).toBe(true)
  })

  it('returns false when required keys are missing', () => {
    expect(isApiError({ message: 'oops' })).toBe(false)
    expect(isApiError(null)).toBe(false)
    expect(isApiError('string')).toBe(false)
  })

  it('returns false when fields exist but have wrong types', () => {
    expect(isApiError({ message: 42, code: null, statusCode: 'bad' })).toBe(false)
  })
})
