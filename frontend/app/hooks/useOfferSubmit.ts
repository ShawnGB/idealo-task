import { FormEvent, useEffect, useRef, useState } from 'react'
import { useFetcher } from 'react-router'

const DEFAULT_PRODUCT_ID = 'EAN-001'

interface OfferResult {
  product_id: string
  accepted_images: string[]
  event_emitted: boolean
  reason: string | null
}

export interface EventLogEntry {
  timestamp: string
  product_id: string
  accepted_images: string[]
  event_emitted: boolean
  reason: string | null
}

export function useOfferSubmit() {
  const submitFetcher = useFetcher<ApiResponse<OfferResult>>()
  const galleryFetcher = useFetcher<ApiResponse<ProductGallery> | null>()
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
    const imageUrls = (data.get('images') as string)
      .split('\n')
      .map((u) => u.trim())
      .filter(Boolean)

    submitFetcher.submit(
      {
        product_id: data.get('product_id') as string,
        merchant_id: data.get('merchant_id') as string,
        merchant_score: Number(data.get('merchant_score')),
        images: imageUrls,
      },
      { method: 'POST', action: '/offers', encType: 'application/json' },
    )
  }

  return {
    handleSubmit,
    isPending: submitFetcher.state !== 'idle',
    submitError: submitFetcher.data?.error ?? null,
    gallery: galleryFetcher.data?.data ?? null,
    galleryError: galleryFetcher.data?.error ?? null,
    isGalleryLoading: galleryFetcher.state === 'loading',
    hasGalleryData: !!galleryFetcher.data,
    eventLog,
  }
}
