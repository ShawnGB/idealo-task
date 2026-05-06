import { useLoaderData } from 'react-router'
import { fetchApi } from '@/lib/api'

export { ErrorBoundary } from '@/components/ErrorBoundary'

export async function loader() {
  return fetchApi<HelloMessage>('/api/hello')
}

export default function Home() {
  const result = useLoaderData<typeof loader>()

  if (result.error) {
    return <p>Error: {result.error.message}</p>
  }

  return <h1>{result.data.message}</h1>
}
