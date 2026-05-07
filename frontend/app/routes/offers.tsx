import { FormEvent, useEffect, useRef, useState } from 'react'
import { useFetcher } from 'react-router'
import type { ClientActionFunctionArgs, ClientLoaderFunctionArgs } from 'react-router'
import { fetchApi } from '@/lib/api'
import { Button } from '@/components/ui/button'

interface OfferResult {
  product_id: string
  accepted_images: string[]
  event_emitted: boolean
  reason: string | null
}

interface EventLogEntry {
  timestamp: string
  product_id: string
  accepted_images: string[]
  event_emitted: boolean
  reason: string | null
}

const DEFAULT_PRODUCT_ID = 'EAN-001'
const DEFAULT_MERCHANT_ID = 'merchant-demo'
const DEFAULT_SCORE = '85'
const DEFAULT_URLS =
  'https://picsum.photos/seed/demo1/400/300\nhttps://picsum.photos/seed/demo2/400/300'

export async function clientLoader({
  request,
}: ClientLoaderFunctionArgs): Promise<ApiResponse<ProductGallery> | null> {
  const url = new URL(request.url)
  const productId = url.searchParams.get('productId')
  if (!productId) return null
  return fetchApi<ProductGallery>(`/api/offers/products/${productId}`)
}

export async function clientAction({
  request,
}: ClientActionFunctionArgs): Promise<ApiResponse<OfferResult>> {
  const body = await request.json()
  return fetchApi<OfferResult>('/api/offers', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  })
}

export default function OffersPage() {
  const submitFetcher = useFetcher<typeof clientAction>()
  const galleryFetcher = useFetcher<typeof clientLoader>()

  const [eventLog, setEventLog] = useState<EventLogEntry[]>([])
  const prevStateRef = useRef<string>('idle')

  useEffect(() => {
    galleryFetcher.load(`/offers?productId=${DEFAULT_PRODUCT_ID}`)
  }, [])

  useEffect(() => {
    if (prevStateRef.current !== 'idle' && submitFetcher.state === 'idle') {
      const result = submitFetcher.data?.data
      if (result) {
        setEventLog((prev) => [
          {
            timestamp: new Date().toISOString(),
            product_id: result.product_id,
            accepted_images: result.accepted_images,
            event_emitted: result.event_emitted,
            reason: result.reason,
          },
          ...prev,
        ])
        galleryFetcher.load(`/offers?productId=${result.product_id}`)
      }
    }
    prevStateRef.current = submitFetcher.state
  }, [submitFetcher.state, submitFetcher.data])

  function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault()
    const form = e.currentTarget
    const data = new FormData(form)
    const imageUrls = (data.get('image_urls') as string)
      .split('\n')
      .map((u) => u.trim())
      .filter(Boolean)

    submitFetcher.submit(
      {
        product_id: data.get('product_id') as string,
        merchant_id: data.get('merchant_id') as string,
        merchant_score: Number(data.get('merchant_score')),
        image_urls: imageUrls,
      },
      { method: 'POST', action: '/offers', encType: 'application/json' },
    )
  }

  const gallery = galleryFetcher.data?.data ?? null
  const galleryError = galleryFetcher.data?.error ?? null
  const submitError = submitFetcher.data?.error ?? null
  const isPending = submitFetcher.state !== 'idle'

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <h1 className="text-2xl font-bold mb-1">Gallery Ingest Demo</h1>
      <p className="text-gray-500 text-sm mb-6">
        Submit merchant offers and watch the gallery state update in real time.
      </p>

      <div className="flex gap-6 items-start">
        {/* Left: Form */}
        <div className="w-80 shrink-0">
          <div className="bg-white border rounded-lg p-5">
            <h2 className="font-semibold mb-4">Submit Offer</h2>
            <form onSubmit={handleSubmit} className="flex flex-col gap-3">
              <label className="flex flex-col gap-1 text-sm font-medium">
                Product ID
                <input
                  name="product_id"
                  defaultValue={DEFAULT_PRODUCT_ID}
                  className="border rounded px-2 py-1 font-normal"
                  required
                />
              </label>
              <label className="flex flex-col gap-1 text-sm font-medium">
                Merchant ID
                <input
                  name="merchant_id"
                  defaultValue={DEFAULT_MERCHANT_ID}
                  className="border rounded px-2 py-1 font-normal"
                  required
                />
              </label>
              <label className="flex flex-col gap-1 text-sm font-medium">
                Merchant Score
                <input
                  name="merchant_score"
                  type="number"
                  defaultValue={DEFAULT_SCORE}
                  className="border rounded px-2 py-1 font-normal"
                  required
                />
              </label>
              <label className="flex flex-col gap-1 text-sm font-medium">
                Image URLs (one per line)
                <textarea
                  name="image_urls"
                  defaultValue={DEFAULT_URLS}
                  rows={4}
                  className="border rounded px-2 py-1 font-mono text-xs font-normal"
                />
              </label>
              <Button type="submit" disabled={isPending}>
                {isPending ? 'Submitting…' : 'Submit Offer'}
              </Button>
              {submitError && (
                <p className="text-red-600 text-sm">{submitError.message}</p>
              )}
            </form>
          </div>
        </div>

        {/* Right: Gallery + Event Feed */}
        <div className="flex-1 flex flex-col gap-4 min-w-0">
          {/* Gallery State */}
          <div className="bg-white border rounded-lg p-5">
            <h2 className="font-semibold mb-3">Gallery State</h2>
            {galleryFetcher.state === 'loading' && (
              <p className="text-gray-400 text-sm">Loading…</p>
            )}
            {galleryFetcher.state === 'idle' && !galleryFetcher.data && (
              <p className="text-gray-400 text-sm">
                No gallery yet — submit an offer first.
              </p>
            )}
            {galleryFetcher.state === 'idle' &&
              galleryError?.statusCode === 404 && (
                <p className="text-gray-400 text-sm">
                  No gallery yet for this product.
                </p>
              )}
            {galleryFetcher.state === 'idle' &&
              galleryError &&
              galleryError.statusCode !== 404 && (
                <p className="text-red-500 text-sm">{galleryError.message}</p>
              )}
            {gallery && (
              <>
                <p className="text-xs text-gray-400 mb-3">
                  Updated {new Date(gallery.updatedAt).toLocaleTimeString()} ·{' '}
                  {gallery.images.length} image
                  {gallery.images.length !== 1 ? 's' : ''}
                </p>
                <div className="flex flex-wrap gap-3">
                  {gallery.images.map((url, i) => (
                    <div key={url} className="flex flex-col items-center gap-1">
                      <div className="relative">
                        {i === 0 && (
                          <span className="absolute -top-1.5 -left-1.5 bg-yellow-400 text-xs font-bold px-1 rounded z-10">
                            #1
                          </span>
                        )}
                        <img
                          src={url}
                          alt={`candidate ${i + 1}`}
                          width={96}
                          height={64}
                          className="w-24 h-16 object-cover rounded border"
                          onError={(e) => {
                            ;(e.target as HTMLImageElement).style.display =
                              'none'
                          }}
                        />
                      </div>
                      <span className="text-xs text-gray-400 w-24 truncate text-center">
                        {url.replace(/^https?:\/\//, '')}
                      </span>
                    </div>
                  ))}
                </div>
              </>
            )}
          </div>

          {/* Event Feed */}
          <div className="bg-white border rounded-lg p-5">
            <h2 className="font-semibold mb-3">Event Feed</h2>
            {eventLog.length === 0 ? (
              <p className="text-gray-400 text-sm">
                No events yet — submit an offer above.
              </p>
            ) : (
              <div className="flex flex-col gap-2 max-h-64 overflow-y-auto">
                {eventLog.map((entry, i) => (
                  <div key={i} className="border rounded p-3 text-sm">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-gray-400 text-xs">
                        {new Date(entry.timestamp).toLocaleTimeString()}
                      </span>
                      <span className="bg-gray-100 text-gray-700 text-xs px-2 py-0.5 rounded">
                        {entry.product_id}
                      </span>
                      {entry.event_emitted ? (
                        <span className="bg-green-100 text-green-700 text-xs px-2 py-0.5 rounded font-medium">
                          gallery:update fired
                        </span>
                      ) : (
                        <span className="bg-gray-100 text-gray-500 text-xs px-2 py-0.5 rounded">
                          no change
                        </span>
                      )}
                      {entry.reason && (
                        <span className="text-gray-500 text-xs italic">
                          {entry.reason}
                        </span>
                      )}
                    </div>
                    <p className="text-gray-500 text-xs mt-1">
                      {entry.accepted_images.length} image
                      {entry.accepted_images.length !== 1 ? 's' : ''} accepted
                    </p>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
