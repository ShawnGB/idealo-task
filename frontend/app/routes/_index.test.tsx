import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import Home from './_index'

vi.mock('react-router', async (importOriginal) => {
  const actual = await importOriginal<typeof import('react-router')>()
  return { ...actual, useLoaderData: vi.fn() }
})

import { useLoaderData } from 'react-router'

describe('Home', () => {
  it('renders the message on success', () => {
    vi.mocked(useLoaderData).mockReturnValue({
      data: { message: 'Hello from Express' },
      error: null,
    })
    render(<Home />)
    expect(screen.getByText('Hello from Express')).toBeInTheDocument()
  })

  it('renders an error message on failure', () => {
    vi.mocked(useLoaderData).mockReturnValue({
      data: null,
      error: { message: 'Not found', code: 'NOT_FOUND', statusCode: 404 },
    })
    render(<Home />)
    expect(screen.getByText('Error: Not found')).toBeInTheDocument()
  })
})
