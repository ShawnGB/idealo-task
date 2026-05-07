# Backend

NestJS 11 + TypeScript. Runs on port `3001`. All routes are prefixed with `/api`.

## Commands

```bash
npm run dev --workspace=backend      # watch mode
npm run test --workspace=backend     # unit tests (Jest)
npm run test:e2e --workspace=backend # e2e tests
```

## Key modules

### `offers`

| File | Responsibility |
|---|---|
| `offers.controller.ts` | `POST /api/offers`, `GET /api/offers/products/:productId` |
| `offers.service.ts` | `processOffer` — validate → rank → persist → emit; `getProductGallery` — read current state |
| `ranking.ts` | `mergeAndRank` (score = merchantScore × imageCount, top 5), `determineTrigger` (returns reason or null) |
| `image-validator.service.ts` | HEAD request per URL; falls back to GET if host returns 405 |
| `gallery-event.service.ts` | Logs `gallery:update` events (extend to emit to a queue) |
| `entities/product-state.entity.ts` | TypeORM entity — stores `candidates[]` as JSON, `updatedAt` |
| `dto/create-offer.dto.ts` | class-validator DTO for the POST body |

### Error handling

`HttpExceptionFilter` catches all `HttpException`s and returns the `ApiError` shape:

```json
{ "message": "...", "code": "NOT_FOUND", "statusCode": 404 }
```

Status → code mapping: `400` → `VALIDATION_ERROR`, `401` → `UNAUTHORIZED`, `404` → `NOT_FOUND`, all others → `INTERNAL_ERROR`.

## Database

SQLite file at `data/db.sqlite` (created on startup). Set `DATABASE_PATH=:memory:` for in-memory (used in all tests).
