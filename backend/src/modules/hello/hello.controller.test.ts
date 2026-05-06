import { describe, it, expect, vi, beforeEach } from 'vitest'
import type { Request, Response } from 'express'
import { getHello } from './hello.controller.js'

vi.mock('./hello.service.js', () => ({
  getHelloMessage: vi.fn().mockReturnValue({ message: 'Hello from Express' }),
}))

import { getHelloMessage } from './hello.service.js'

function mockReq(query: Record<string, unknown> = {}): Request {
  return { query } as unknown as Request
}

function mockRes(): Response {
  return { json: vi.fn() } as unknown as Response
}

beforeEach(() => {
  vi.mocked(getHelloMessage).mockReturnValue({ message: 'Hello from Express' })
})

describe('getHello', () => {
  it('passes string name to the service and sends the result', () => {
    const res = mockRes()
    getHello(mockReq({ name: 'world' }), res)
    expect(getHelloMessage).toHaveBeenCalledWith('world')
    expect(res.json).toHaveBeenCalledWith({ message: 'Hello from Express' })
  })

  it('passes undefined to the service when name is an array', () => {
    const res = mockRes()
    getHello(mockReq({ name: ['foo', 'bar'] }), res)
    expect(getHelloMessage).toHaveBeenCalledWith(undefined)
  })

  it('passes undefined to the service when name is absent', () => {
    const res = mockRes()
    getHello(mockReq({}), res)
    expect(getHelloMessage).toHaveBeenCalledWith(undefined)
  })
})
