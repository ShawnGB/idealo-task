import './app.css'
import {
  Links,
  Meta,
  Outlet,
  Scripts,
  ScrollRestoration,
} from 'react-router'
import { useRouteErrorMessage } from '@/hooks/useRouteErrorMessage'

function SharedHead({ title }: { title: string }) {
  return (
    <head>
      <meta charSet="utf-8" />
      <meta name="viewport" content="width=device-width, initial-scale=1" />
      <Meta />
      <Links />
      <link rel="icon" href="/favicon.svg" type="image/svg+xml" />
      <link rel="apple-touch-icon" href="/favicon.svg" />
      <title>{title}</title>
    </head>
  )
}

export function HydrateFallback() {
  return (
    <html lang="en">
      <head>
        <meta charSet="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <link rel="icon" href="/favicon.svg" type="image/svg+xml" />
        <title>Loading…</title>
      </head>
      <body />
    </html>
  )
}

export function ErrorBoundary() {
  const message = useRouteErrorMessage()
  return (
    <html lang="en">
      <SharedHead title="Error" />
      <body>
        <h1>Unexpected Error</h1>
        <p>{message}</p>
        <Scripts />
      </body>
    </html>
  )
}

export default function Root() {
  return (
    <html lang="en">
      <SharedHead title="App" />
      <body>
        <Outlet />
        <ScrollRestoration />
        <Scripts />
      </body>
    </html>
  )
}
