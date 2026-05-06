export interface ImageCandidate {
  url: string;
  imageCount: number;
  merchantScore: number;
}

export type GalleryUpdateReason =
  | 'first_images'
  | 'top_image_changed'
  | 'merchant_added';

export function mergeAndRank(
  existing: ImageCandidate[],
  incoming: ImageCandidate[],
): ImageCandidate[] {
  const map = new Map<string, ImageCandidate>(
    existing.map((c) => [c.url, c]),
  );

  for (const c of incoming) {
    const prev = map.get(c.url);
    if (
      !prev ||
      c.imageCount > prev.imageCount ||
      (c.imageCount === prev.imageCount && c.merchantScore > prev.merchantScore)
    ) {
      map.set(c.url, c);
    }
  }

  return Array.from(map.values())
    .sort((a, b) =>
      b.imageCount !== a.imageCount
        ? b.imageCount - a.imageCount
        : b.merchantScore - a.merchantScore,
    )
    .slice(0, 5);
}

export function determineTrigger(
  previous: ImageCandidate[],
  next: ImageCandidate[],
): GalleryUpdateReason | null {
  if (next.length === 0) return null;
  if (previous.length === 0) return 'first_images';
  if (previous[0].url !== next[0].url) return 'top_image_changed';
  const prevUrls = new Set(previous.map((c) => c.url));
  if (next.some((c) => !prevUrls.has(c.url))) return 'merchant_added';
  return null;
}
