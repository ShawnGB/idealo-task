export interface ImageCandidate {
  url: string;
  imageCount: number;
  merchantScore: number;
}

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

