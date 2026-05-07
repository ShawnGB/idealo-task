import { ImageCandidate } from './ranking';

export type GalleryUpdateReason =
  | 'first_images'
  | 'top_image_changed'
  | 'merchant_added';

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
