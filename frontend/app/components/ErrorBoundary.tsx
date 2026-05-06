import { useRouteErrorMessage } from '@/hooks/useRouteErrorMessage'

export function ErrorBoundary() {
  const message = useRouteErrorMessage()
  return <p>Error: {message}</p>
}
