# App Template

A fork-ready full-stack TypeScript monorepo template.

## Stack

| Layer | Technology | Version |
|---|---|---|
| Runtime | Node.js | 22 |
| Language | TypeScript | 6 |
| Backend | Express | 5 |
| Frontend | React | 19 |
| Routing | React Router | 7 |
| Bundler | Vite | 8+ |
| Dev runner | tsx | 4 |
| Containers | Docker Compose | v2 |
| Packages | npm workspaces | — |

## Quick Start

### Local

```bash
npm install
npm run dev --workspace=backend    # http://localhost:3001
npm run dev --workspace=frontend   # http://localhost:5173
```

### Docker

```bash
docker compose up --build                              # first run
docker compose up                                      # subsequent runs
docker compose down                                    # stop
docker compose down -v && docker compose up --build    # after changing dependencies
```

### Testing

```bash
npm test                             # run all tests (backend + frontend)
npm run test --workspace=backend     # backend only
npm run test --workspace=frontend    # frontend only
```

## Project Structure

```
├── backend/
│   └── src/
│       ├── modules/        Feature modules (routes + controller + service)
│       │   └── hello/
│       ├── middleware/     errorHandler, notFound
│       ├── lib/            Shared utilities (AppError)
│       ├── config/         env.ts (zod-validated), envSchema.ts
│       └── index.ts        App entry point
├── frontend/
│   └── app/
│       ├── components/     Shared UI components (ErrorBoundary)
│       ├── hooks/          Custom React hooks (useRouteErrorMessage)
│       ├── lib/            Utilities (fetchApi, isApiError)
│       ├── store/          State management (empty — add Zustand/Redux/etc. here)
│       ├── routes/         File-based routes
│       └── root.tsx        Root HTML layout
├── packages/
│   └── shared/
│       └── src/
│           └── globals.d.ts  Global ambient types (no imports needed)
└── docker-compose.yml
```

## Path Aliases

Both workspaces expose `@/` as a shortcut to their source root:

| Import | Resolves to |
|---|---|
| `@/lib/api` | `frontend/app/lib/api.ts` |
| `@/lib/AppError.js` | `backend/src/lib/AppError.ts` |

> **Backend production build note:** `@/` is resolved at dev time by `tsx`. If you add a `tsc` build step, install `tsc-alias` and run `tsc-alias -p tsconfig.json` after `tsc` to rewrite the paths in the compiled output.

## Shared Types

Types in `packages/shared/src/globals.d.ts` are globally available in both backend and frontend — no import needed.

```typescript
// Just use them directly in any file:
const response: ApiResponse<HelloMessage> = ...
const err: ApiError = ...
```

To add a new shared type, add it to `globals.d.ts` as an `interface` or `type` (no `export` keyword).

## Error Handling

The template ships a typed error contract that runs end-to-end.

**Backend — throwing errors**

Services throw `AppError` for expected failures. `errorHandler` (registered last in `index.ts`) converts it to `ApiError` JSON automatically. Unknown errors log and return a generic 500.

```typescript
import { AppError } from '@/lib/AppError.js'

// In a service:
if (!found) throw new AppError(404, 'NOT_FOUND', 'Resource not found')
```

`ApiErrorCode` values are declared in `packages/shared/src/globals.d.ts`. Add codes there as the app grows.

**Frontend — consuming errors**

`fetchApi<T>` never throws — it always resolves to `ApiResponse<T>`:

```typescript
import { fetchApi } from '@/lib/api'

const result = await fetchApi<MyType>('/api/resource')

if (result.error) {
  // result.error is ApiError — typed, never null here
  console.error(result.error.message)
} else {
  // result.data is MyType — never null here
}
```

For route-level crashes (unexpected throws, network failures before a response), export `ErrorBoundary` from `@/components/ErrorBoundary` in your route file:

```typescript
export { ErrorBoundary } from '@/components/ErrorBoundary'
```

`useRouteErrorMessage` (`@/hooks/useRouteErrorMessage`) extracts a human-readable string from any React Router error shape — use it if you need a custom error UI.

## Environment Variables

Copy `backend/.env.example` to `backend/.env` and fill in values:

```bash
cp backend/.env.example backend/.env
```

The backend validates all env vars at startup using zod — if a required var is missing or has the wrong type, the process exits immediately with a clear error message.

To add a new backend env var:

1. Add it to `backend/src/config/envSchema.ts`:
   ```typescript
   export const envSchema = z.object({
     PORT: z.coerce.number().default(3001),
     DATABASE_URL: z.string().url(),  // add here
   })
   ```
2. Add it to `backend/.env.example` and `backend/.env`
3. Access it anywhere via `env.DATABASE_URL` (import `env` from `@/config/env.js`)

Add `VITE_*` frontend variables to `frontend/app/vite-env.d.ts` to keep them typed:

```typescript
interface ImportMetaEnv {
  readonly VITE_API_URL: string  // example
}
```

## Adding a Backend Feature

1. Create `backend/src/modules/<name>/`:
   - `<name>.service.ts` — business logic (no Express imports)
   - `<name>.controller.ts` — calls service, sends response
   - `<name>.routes.ts` — `Router()`, registers endpoints
2. Mount the router in `backend/src/index.ts`:
   ```typescript
   import nameRouter from './modules/<name>/<name>.routes.js'
   app.use('/<name>', nameRouter)
   ```

## Adding a Frontend Route

Add a file to `frontend/app/routes/`. React Router picks it up automatically.

| File | URL |
|---|---|
| `_index.tsx` | `/` |
| `about.tsx` | `/about` |
| `posts.$id.tsx` | `/posts/:id` |
| `dashboard._index.tsx` | `/dashboard` (nested) |

Each route file can export:
- `clientLoader` — fetch data before rendering (SPA mode; use `clientLoader`, not `loader`)
- `action` — handle form submissions
- `ErrorBoundary` — error UI for this route (re-export from `@/components/ErrorBoundary` or define locally)
- `default` — the page component

## Express 5 Notes

> For reviewers familiar with Express 4

**Async errors bubble automatically.** In Express 4, async errors had to be caught and forwarded:

```typescript
// Express 4 — required
app.get('/path', async (req, res, next) => {
  try {
    const data = await riskyOperation()
    res.json(data)
  } catch (err) {
    next(err)
  }
})
```

In Express 5, throwing from an async handler (or returning a rejected promise) is caught by the router automatically:

```typescript
// Express 5 — throw, Express handles it
app.get('/path', async (req, res) => {
  const data = await riskyOperation()
  res.json(data)
})
```

No `next`, no try/catch in controllers.

Other changes relevant to this template:
- `express.json()` is built in (since Express 4.16) — no need for the `body-parser` package
- Route path syntax changed in Express 5 (path-to-regexp v8) — some Express 4 regex-style paths are invalid

## React Router v7 Notes

> For reviewers familiar with React Router v5/v6 or Next.js

**Single package.** `react-router` v7 replaces both `react-router` and `react-router-dom`. Import everything from `'react-router'`.

**SPA mode.** This template uses `ssr: false` in `react-router.config.ts`. Loaders run in the browser — they are typed `fetch` calls, not server-side functions.

**File-based routing.** Files in `app/routes/` are registered automatically. No route definition file needed.

**Generated types.** React Router generates per-route types into `frontend/.react-router/types/` at dev/build time. This directory is gitignored — it appears after the first `npm run dev`.

**Root layout requirements.** `app/root.tsx` must include `<Scripts />` and `<ScrollRestoration />` from `'react-router'`. These are required by framework mode — they inject the client bundle and restore scroll position between navigations.

## Forking This Template

1. `package.json` → change `"name": "app"` to your project name
2. `packages/shared/package.json` → change `"name": "@app/shared"` to `@yourscope/shared`
3. Update all references to `@app/shared` in:
   - `backend/tsconfig.json` (paths alias key — if you re-add a module alias)
   - `frontend/tsconfig.json` (paths alias key — if you re-add a module alias)
   - `frontend/vite.config.ts` (alias key — if you re-add a Vite alias)
4. Replace `backend/src/modules/hello/` with your first feature module
5. Replace `frontend/app/routes/_index.tsx` with your home route
6. Add your env vars to `backend/src/config/envSchema.ts` and `.env.example`
7. Run `npm install` to regenerate `package-lock.json`
