import type { EventLogEntry } from '@/hooks/useOfferSubmit'

interface Props {
  eventLog: EventLogEntry[]
}

export function EventFeed({ eventLog }: Props) {
  return (
    <div className="bg-white border rounded-lg p-5">
      <h2 className="font-semibold mb-3">Event Feed</h2>
      {eventLog.length === 0 ? (
        <p className="text-gray-400 text-sm">No events yet — submit an offer above.</p>
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
                  <span className="text-gray-500 text-xs italic">{entry.reason}</span>
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
  )
}
