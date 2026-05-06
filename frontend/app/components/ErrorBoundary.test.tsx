import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'

vi.mock('react-router', async (importOriginal) => {
  const actual = await importOriginal<typeof import('react-router')>()
  return { ...actual, useRouteError: vi.fn() }
})

import { useRouteError } from 'react-router'
import { ErrorBoundary } from '@/components/ErrorBoundary'

describe('ErrorBoundary', () => {
  it('renders the extracted error message', () => {
    vi.mocked(useRouteError).mockReturnValue(new Error('something broke'))
    render(<ErrorBoundary />)
    expect(screen.getByText('Error: something broke')).toBeInTheDocument()
  })
})
