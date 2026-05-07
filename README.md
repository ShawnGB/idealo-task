# Product Gallery Ingest

Merchants submit image offers for a product; the service validates, ranks, and persists the best images, then fires a `gallery:update` event when the gallery changes meaningfully. A demo UI at `/offers` lets you submit offers and watch the gallery update live.

## Stack

| Layer | Technology |
|---|---|
| Backend | NestJS 11 + TypeScript |
| Database | SQLite via TypeORM (`data/db.sqlite`; `:memory:` in tests) |
| Frontend | React 19 + React Router 7 (SSR) + Tailwind CSS v4 + shadcn/ui |
| Shared types | `packages/shared/src/globals.d.ts` — ambient globals, no imports needed |
| Containers | Docker Compose v2 |

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

### Tests (one command)

```bash
npm test
```

Runs all backend unit + e2e tests (Jest) and frontend unit tests (Vitest). All tests mock `fetch` — **no network access required**.

---

## API

### `POST /api/offers` → `201 Created`

```json
{
  "offer_id": "offer-123",
  "product_id": "EAN:4006381333931",
  "merchant_id": "shop-77",
  "merchant_score": 42,
  "images": [
    "https://cdn.merchant.de/images/1234-front.jpg",
    "https://cdn.merchant.de/images/1234-side.jpg"
  ]
}
```

Response:

```json
{
  "data": {
    "product_id": "EAN:4006381333931",
    "accepted_images": ["https://cdn.merchant.de/images/1234-front.jpg"],
    "event_emitted": true,
    "reason": "first_images"
  },
  "error": null
}
```

### `GET /api/offers/products/:productId` → `200 OK`

Returns the current ranked gallery for a product. `404` if no valid offer has been submitted yet.

---

## How it works

**1. Image validation** (`ImageValidatorService`)

Each URL is checked for well-formed `http(s)` syntax, then a HEAD request confirms the server returns `image/*`. If the host returns `405 Method Not Allowed` (common with CDNs like picsum.photos), the service falls back to a GET and cancels the body immediately after reading the headers.

To disable network checks for offline testing: all tests mock `global.fetch` directly, so `npm test` works without internet. There is no runtime flag to skip network checks in the live server — URL format validation always runs, and the HEAD/GET check is always attempted.

**2. Ranking** (`ranking.ts`)

Accepted images are merged with existing per-product candidates. Score = `merchantScore × imageCount` (offers with more images preferred; tie-broken by merchant score). Top 5 unique URLs are kept.

**3. Trigger rule** (`determineTrigger`)

An event is emitted only when the candidate set changes meaningfully:
- `first_images` — product had no images before
- `top_image_changed` — the #1 ranked image is different
- `merchant_added` — a new URL entered the top-5 without displacing the top

Returns `null` (no event) when the candidate set is identical — this is also how **idempotency** is achieved: posting the same offer twice produces the same merged candidates, so `determineTrigger` returns null and no duplicate event fires.

**4. Events** (`GalleryEventService`)

Currently logs to stdout. Extend `emit()` to POST to a webhook URL or write to a queue. The event shape:

```json
{
  "event_type": "gallery:update",
  "product_id": "EAN:4006381333931",
  "triggered_at": "2026-05-07T09:22:54.000Z",
  "images": ["https://cdn.merchant.de/images/1234-front.jpg"],
  "reason": "first_images"
}
```

---

## Design decisions and trade-offs

**SQLite over in-memory state** — product state survives restarts without adding a separate database dependency. TypeORM makes it trivial to swap to Postgres later.

**Idempotency via ranking comparison, not offer_id deduplication** — tracking `offer_id` would require an extra table and lookup on every request. The ranking comparison achieves the same outcome: identical inputs produce identical candidate sets, so no event fires. The trade-off is that two semantically different offers with the same final ranking also won't re-fire an event — acceptable for a gallery update service.

**HEAD check with GET fallback** — many image CDNs block HEAD requests (HTTP 405). A GET-only approach would download full image data; aborting after headers is the right middle ground.

**`reason` field on POST response** — the spec response is `{"accepted": true, "offer_id": "offer-123"}`. Our response is richer: it includes `accepted_images`, `event_emitted`, and `reason`. This powers the demo UI's event feed and gives callers more signal without breaking the contract.

**No exponential backoff on event delivery** — the nice-to-have retry logic wasn't implemented. `GalleryEventService.emit()` is the right place to add it; the interface is already isolated.

---

## Project structure

```
├── backend/src/
│   ├── modules/offers/
│   │   ├── offers.controller.ts        POST /offers, GET /offers/products/:id
│   │   ├── offers.service.ts           processOffer, getProductGallery
│   │   ├── ranking.ts                  mergeAndRank, determineTrigger
│   │   ├── image-validator.service.ts  HEAD + GET-fallback content-type check
│   │   ├── gallery-event.service.ts    Emits gallery:update events (stdout)
│   │   ├── dto/create-offer.dto.ts     Input validation (class-validator)
│   │   └── entities/product-state.entity.ts  TypeORM — candidates[], updatedAt
│   └── filters/http-exception.filter.ts  All errors → ApiError JSON shape
├── frontend/app/
│   └── routes/offers.tsx               Demo UI — form + gallery panel + event feed
└── packages/shared/src/globals.d.ts    ApiError, ApiResponse<T>, ProductGallery
```
