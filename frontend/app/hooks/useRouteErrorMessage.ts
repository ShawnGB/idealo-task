import { isRouteErrorResponse, useRouteError } from 'react-router'

export function useRouteErrorMessage(): string {
  const error = useRouteError()
  if (isRouteErrorResponse(error)) {
    const message =
      error.data != null &&
      typeof error.data === 'object' &&
      typeof error.data.message === 'string'
        ? error.data.message
        : error.statusText
    return message
  }
  if (error instanceof Error) {
    return error.message
  }
  return 'Something went wrong'
}
