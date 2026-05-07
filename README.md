# Product Gallery Ingest

A full-stack TypeScript monorepo. Merchants submit image offers for a product; the service validates, ranks, and persists the best images, then fires a `gallery:update` event when the gallery changes. A demo UI at `/offers` lets you submit offers and watch the gallery state update live.

## Stack

| Layer | Technology |
|---|---|
| Backend | NestJS 11 + TypeScript |
| Database | SQLite via TypeORM (file `data/db.sqlite`, `:memory:` in tests) |
| Frontend | React 19 + React Router 7 (SSR) + Tailwind CSS v4 + shadcn/ui |
| Shared types | `packages/shared/src/globals.d.ts` — ambient globals, no imports |
| Containers | Docker Compose v2 |
| Packages | npm workspaces |

## Quick start

### Docker (recommended)

```bash
docker compose up --build        # first run
docker compose up                # subsequent runs
docker compose down -v && docker compose up --build  # after changing dependencies
```

Frontend: http://localhost:5173 · Backend: http://localhost:3001

### Local dev

```bash
npm install
npm run dev --workspace=backend    # http://localhost:3001
npm run dev --workspace=frontend   # http://localhost:5173
```

### Tests

```bash
npm test                            # all tests
npm run test --workspace=backend    # backend unit + e2e (Jest)
npm run test --workspace=frontend   # frontend unit (Vitest)
```

---

## How it works

### Offer ingestion — `POST /api/offers`

```json
{
  "product_id": "EAN-001",
  "merchant_id": "merchant-demo",
  "merchant_score": 85,
  "image_urls": ["https://example.com/img1.jpg"]
}
```

Three steps:

**1. Image validation** (`ImageValidatorService`)
Each URL is checked with a HEAD request. If the host returns `405 Method Not Allowed`, the service falls back to a GET (body cancelled immediately after headers). URLs that don't return an `image/*` content-type are dropped.

**2. Ranking** (`ranking.ts`)
Accepted images are merged with the product's existing candidates. Each candidate is scored by `merchantScore × imageCount`. The top 5 survive. `determineTrigger` compares the old and new candidate lists and returns the reason the gallery changed — `first_images`, `top_image_changed`, or `merchant_added` — or `null` if nothing meaningful changed.

**3. Persistence + events** (`GalleryEventService`)
The merged state is saved to `ProductState` via TypeORM. If the trigger reason is non-null, a `gallery:update` event is emitted with the images and reason.

**Response:**

```json
{
  "data": {
    "product_id": "EAN-001",
    "accepted_images": ["https://example.com/img1.jpg"],
    "event_emitted": true,
    "reason": "first_images"
  },
  "error": null
}
```

### Gallery read — `GET /api/offers/products/:productId`

Returns the current top images for a product. Returns `404` if no valid offer has been submitted yet.

```json
{
  "data": {
    "product_id": "EAN-001",
    "images": ["https://example.com/img1.jpg"],
    "updatedAt": "2026-05-07T09:22:54.000Z"
  },
  "error": null
}
```

### Error shape

All errors follow the same `ApiError` contract:

```json
{ "message": "...", "code": "NOT_FOUND", "statusCode": 404 }
```

---

## Demo UI — `/offers`

Submit offers and watch the gallery update in real time. The form is pre-filled for instant demo use.

- **Gallery State panel** — refreshes after each submit via `useFetcher`. Shows ranked image thumbnails with a `#1` badge on the top candidate.
- **Event Feed** — accumulates POST results in component state (session only). Shows whether `gallery:update` was fired, the trigger reason, and how many images were accepted.

---

## Project structure

```
├── backend/src/
│   ├── app.module.ts
│   ├── main.ts
│   ├── filters/              HttpExceptionFilter → ApiError JSON
│   └── modules/offers/
│       ├── offers.controller.ts   POST /offers, GET /offers/products/:productId
│       ├── offers.service.ts      processOffer, getProductGallery
│       ├── ranking.ts             mergeAndRank, determineTrigger, scoring
│       ├── image-validator.service.ts  HEAD + GET-fallback content-type check
│       ├── gallery-event.service.ts    Emits gallery:update events
│       ├── dto/                   CreateOfferDto (class-validator)
│       └── entities/              ProductState (TypeORM entity)
├── frontend/app/
│   ├── routes/
│   │   ├── _index.tsx        GET /api/hello demo
│   │   └── offers.tsx        /offers demo page
│   └── lib/
│       ├── api.ts            fetchApi<T> — never throws, resolves to ApiResponse<T>
│       └── errors.ts         isApiError type guard
└── packages/shared/src/
    └── globals.d.ts          ApiError, ApiResponse<T>, ProductGallery (ambient globals)
```
