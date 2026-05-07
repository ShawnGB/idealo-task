import { mergeAndRank, ImageCandidate } from './ranking';
import { determineTrigger } from './gallery-triggers';

const c = (url: string, imageCount = 1, merchantScore = 80): ImageCandidate => ({
  url,
  imageCount,
  merchantScore,
});

describe('mergeAndRank', () => {
  it('returns incoming candidates when existing is empty', () => {
    const incoming = [c('https://a.com/1.jpg', 2, 80)];
    expect(mergeAndRank([], incoming)).toEqual(incoming);
  });

  it('prefers offer with more images over higher merchantScore', () => {
    const existing = [c('https://a.com/1.jpg', 1, 99)];
    const incoming = [c('https://a.com/1.jpg', 3, 10)];
    expect(mergeAndRank(existing, incoming)[0].imageCount).toBe(3);
  });

  it('prefers higher merchantScore when imageCount is equal', () => {
    const existing = [c('https://a.com/1.jpg', 2, 50)];
    const incoming = [c('https://a.com/1.jpg', 2, 90)];
    expect(mergeAndRank(existing, incoming)[0].merchantScore).toBe(90);
  });

  it('keeps existing entry when new offer is strictly worse', () => {
    const existing = [c('https://a.com/1.jpg', 3, 80)];
    const incoming = [c('https://a.com/1.jpg', 1, 99)];
    expect(mergeAndRank(existing, incoming)[0].imageCount).toBe(3);
  });

  it('limits result to 5 candidates, dropping the lowest-ranked', () => {
    const existing = Array.from({ length: 5 }, (_, i) =>
      c(`https://a.com/${i}.jpg`, 1, 80),
    );
    const incoming = [c('https://a.com/new.jpg', 3, 50)];
    const result = mergeAndRank(existing, incoming);
    expect(result).toHaveLength(5);
    expect(result[0].url).toBe('https://a.com/new.jpg');
  });

  it('sorts by imageCount desc then merchantScore desc', () => {
    const candidates = [
      c('https://a.com/low.jpg', 1, 99),
      c('https://a.com/high.jpg', 3, 10),
      c('https://a.com/mid.jpg', 2, 50),
    ];
    const result = mergeAndRank(candidates, []);
    expect(result.map((r) => r.url)).toEqual([
      'https://a.com/high.jpg',
      'https://a.com/mid.jpg',
      'https://a.com/low.jpg',
    ]);
  });

  it('returns empty array when both inputs are empty', () => {
    expect(mergeAndRank([], [])).toEqual([]);
  });
});

describe('determineTrigger', () => {
  it('returns null when next is empty (no valid images)', () => {
    expect(determineTrigger([c('https://a.com/1.jpg')], [])).toBeNull();
  });

  it('returns first_images when previous is empty', () => {
    expect(determineTrigger([], [c('https://a.com/1.jpg')])).toBe('first_images');
  });

  it('returns top_image_changed when top URL differs', () => {
    expect(
      determineTrigger([c('https://a.com/old.jpg')], [c('https://a.com/new.jpg')]),
    ).toBe('top_image_changed');
  });

  it('returns merchant_added when a new URL enters top-5 but top-1 is unchanged', () => {
    expect(
      determineTrigger(
        [c('https://a.com/1.jpg')],
        [c('https://a.com/1.jpg'), c('https://a.com/2.jpg')],
      ),
    ).toBe('merchant_added');
  });

  it('returns null when candidate set is identical', () => {
    expect(
      determineTrigger([c('https://a.com/1.jpg')], [c('https://a.com/1.jpg')]),
    ).toBeNull();
  });

  it('returns top_image_changed even when new URLs also entered top-5', () => {
    expect(
      determineTrigger(
        [c('https://a.com/old.jpg')],
        [c('https://a.com/new.jpg'), c('https://a.com/extra.jpg')],
      ),
    ).toBe('top_image_changed');
  });
});
