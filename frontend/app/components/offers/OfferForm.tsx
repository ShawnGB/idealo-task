import { FormEvent } from 'react'
import { Button } from '@/components/ui/button'

const DEFAULT_PRODUCT_ID = 'EAN-001'
const DEFAULT_MERCHANT_ID = 'merchant-demo'
const DEFAULT_SCORE = '85'
const DEFAULT_URLS =
  'https://picsum.photos/seed/demo1/400/300\nhttps://picsum.photos/seed/demo2/400/300'

interface Props {
  isPending: boolean
  submitError: ApiError | null
  onSubmit: (e: FormEvent<HTMLFormElement>) => void
}

export function OfferForm({ isPending, submitError, onSubmit }: Props) {
  return (
    <div className="w-80 shrink-0">
      <div className="bg-white border rounded-lg p-5">
        <h2 className="font-semibold mb-4">Submit Offer</h2>
        <form onSubmit={onSubmit} className="flex flex-col gap-3">
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
              name="images"
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
  )
}
