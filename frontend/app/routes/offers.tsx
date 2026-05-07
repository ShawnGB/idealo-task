import type { ClientActionFunctionArgs, ClientLoaderFunctionArgs } from 'react-router'
import { useOfferSubmit } from '@/hooks/useOfferSubmit'
import { OfferForm } from '@/components/offers/OfferForm'
import { GalleryPanel } from '@/components/offers/GalleryPanel'
import { EventFeed } from '@/components/offers/EventFeed'

interface OfferResult {
  product_id: string
  accepted_images: string[]
  event_emitted: boolean
  reason: string | null
}

export function loader() {
  return null
}

export async function clientLoader({
  request,
}: ClientLoaderFunctionArgs): Promise<ApiResponse<ProductGallery> | null> {
  const url = new URL(request.url)
  const productId = url.searchParams.get('productId')
  if (!productId) return null
  try {
    const res = await fetch(`/api/offers/products/${productId}`)
    return res.json() as Promise<ApiResponse<ProductGallery>>
  } catch {
    return { data: null, error: { message: 'Network error', code: 'UNKNOWN', statusCode: 0 } }
  }
}

export async function clientAction({
  request,
}: ClientActionFunctionArgs): Promise<ApiResponse<OfferResult>> {
  const body = await request.json()
  try {
    const res = await fetch('/api/offers', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    })
    return res.json() as Promise<ApiResponse<OfferResult>>
  } catch {
    return { data: null, error: { message: 'Network error', code: 'UNKNOWN', statusCode: 0 } }
  }
}

export default function OffersPage() {
  const { handleSubmit, isPending, submitError, gallery, galleryError, isGalleryLoading, hasGalleryData, eventLog } =
    useOfferSubmit()

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <h1 className="text-2xl font-bold mb-1">Gallery Ingest Demo</h1>
      <p className="text-gray-500 text-sm mb-6">
        Submit merchant offers and watch the gallery state update in real time.
      </p>
      <div className="flex gap-6 items-start">
        <OfferForm isPending={isPending} submitError={submitError} onSubmit={handleSubmit} />
        <div className="flex-1 flex flex-col gap-4 min-w-0">
          <GalleryPanel
            isLoading={isGalleryLoading}
            hasData={hasGalleryData}
            gallery={gallery}
            galleryError={galleryError}
          />
          <EventFeed eventLog={eventLog} />
        </div>
      </div>
    </div>
  )
}
