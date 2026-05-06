import { isApiError } from './errors'

function resolveUrl(url: string): string {
  if (url.startsWith('/') && typeof window === 'undefined') {
    const base = process.env.BACKEND_URL ?? 'http://localhost:3001'
    return `${base}${url}`
  }
  return url
}

export async function fetchApi<T>(url: string): Promise<ApiResponse<T>> {
  let res: Response
  try {
    res = await fetch(resolveUrl(url))
  } catch {
    return { data: null, error: { message: 'Network error', code: 'UNKNOWN', statusCode: 0 } }
  }

  if (res.ok) {
    const data: T = await res.json()
    return { data, error: null }
  }

  try {
    const body: unknown = await res.json()
    if (isApiError(body)) return { data: null, error: body }
  } catch {
    // unparseable body falls through
  }

  return {
    data: null,
    error: {
      message: 'Unexpected error',
      code: 'UNKNOWN',
      statusCode: res.status,
    },
  }
}
