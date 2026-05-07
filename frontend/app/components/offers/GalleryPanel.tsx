interface Props {
  isLoading: boolean
  hasData: boolean
  gallery: ProductGallery | null
  galleryError: ApiError | null
}

export function GalleryPanel({ isLoading, hasData, gallery, galleryError }: Props) {
  return (
    <div className="bg-white border rounded-lg p-5">
      <h2 className="font-semibold mb-3">Gallery State</h2>
      {isLoading && <p className="text-gray-400 text-sm">Loading…</p>}
      {!isLoading && !hasData && (
        <p className="text-gray-400 text-sm">No gallery yet — submit an offer first.</p>
      )}
      {!isLoading && galleryError?.statusCode === 404 && (
        <p className="text-gray-400 text-sm">No gallery yet for this product.</p>
      )}
      {!isLoading && galleryError && galleryError.statusCode !== 404 && (
        <p className="text-red-500 text-sm">{galleryError.message}</p>
      )}
      {gallery && (
        <>
          <p className="text-xs text-gray-400 mb-3">
            Updated {new Date(gallery.updatedAt).toLocaleTimeString()} ·{' '}
            {gallery.images.length} image{gallery.images.length !== 1 ? 's' : ''}
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
                      ;(e.target as HTMLImageElement).style.display = 'none'
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
  )
}
