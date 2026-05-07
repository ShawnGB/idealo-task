import { ImageValidatorService } from './image-validator.service';

describe('ImageValidatorService', () => {
  let service: ImageValidatorService;

  beforeEach(() => {
    service = new ImageValidatorService();
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  describe('filterValidUrls', () => {
    it('keeps http URLs', () => {
      expect(service.filterValidUrls(['http://example.com/img.jpg'])).toEqual([
        'http://example.com/img.jpg',
      ]);
    });

    it('keeps https URLs', () => {
      expect(service.filterValidUrls(['https://example.com/img.jpg'])).toEqual([
        'https://example.com/img.jpg',
      ]);
    });

    it('removes ftp and other non-http(s) scheme URLs', () => {
      expect(
        service.filterValidUrls(['ftp://example.com/img.jpg', 'data:image/png;base64,abc']),
      ).toEqual([]);
    });

    it('removes malformed strings', () => {
      expect(service.filterValidUrls(['not-a-url', ':::bad', ''])).toEqual([]);
    });

    it('returns empty array for empty input', () => {
      expect(service.filterValidUrls([])).toEqual([]);
    });
  });

  describe('validateImages', () => {
    it('accepts a URL that returns 2xx with image/* content-type', async () => {
      jest.spyOn(global, 'fetch').mockResolvedValue({
        ok: true,
        headers: { get: () => 'image/jpeg' },
      } as unknown as Response);

      const result = await service.validateImages(['https://example.com/img.jpg']);
      expect(result).toEqual(['https://example.com/img.jpg']);
    });

    it('rejects a URL that returns non-2xx status', async () => {
      jest.spyOn(global, 'fetch').mockResolvedValue({
        ok: false,
        headers: { get: () => 'image/jpeg' },
      } as unknown as Response);

      const result = await service.validateImages(['https://example.com/img.jpg']);
      expect(result).toEqual([]);
    });

    it('rejects a URL whose Content-Type is not image/*', async () => {
      jest.spyOn(global, 'fetch').mockResolvedValue({
        ok: true,
        headers: { get: () => 'text/html' },
      } as unknown as Response);

      const result = await service.validateImages(['https://example.com/img.jpg']);
      expect(result).toEqual([]);
    });

    it('rejects a URL whose Content-Type header is null', async () => {
      jest.spyOn(global, 'fetch').mockResolvedValue({
        ok: true,
        headers: { get: () => null },
      } as unknown as Response);

      const result = await service.validateImages(['https://example.com/img.jpg']);
      expect(result).toEqual([]);
    });

    it('rejects a URL that throws (timeout / network error)', async () => {
      jest.spyOn(global, 'fetch').mockRejectedValue(new Error('network error'));

      const result = await service.validateImages(['https://example.com/img.jpg']);
      expect(result).toEqual([]);
    });

    it('skips HEAD check entirely for non-http(s) URLs', async () => {
      const fetchSpy = jest.spyOn(global, 'fetch').mockResolvedValue({
        ok: true,
        headers: { get: () => 'image/jpeg' },
      } as unknown as Response);

      const result = await service.validateImages(['ftp://example.com/img.jpg']);
      expect(result).toEqual([]);
      expect(fetchSpy).not.toHaveBeenCalled();
    });

    const head405: Response = {
      ok: false,
      status: 405,
      headers: { get: () => null },
    } as unknown as Response;

    it('falls back to GET when HEAD returns 405 and accepts if content-type is image/*', async () => {
      jest
        .spyOn(global, 'fetch')
        .mockResolvedValueOnce(head405)
        .mockResolvedValueOnce({
          ok: true,
          status: 200,
          headers: { get: () => 'image/jpeg' },
          body: { cancel: jest.fn().mockResolvedValue(undefined) },
        } as unknown as Response);

      const result = await service.validateImages(['https://example.com/img.jpg']);
      expect(result).toEqual(['https://example.com/img.jpg']);
    });

    it('rejects when GET fallback after 405 returns non-image content-type', async () => {
      jest
        .spyOn(global, 'fetch')
        .mockResolvedValueOnce(head405)
        .mockResolvedValueOnce({
          ok: true,
          status: 200,
          headers: { get: () => 'text/html' },
          body: { cancel: jest.fn().mockResolvedValue(undefined) },
        } as unknown as Response);

      const result = await service.validateImages(['https://example.com/img.jpg']);
      expect(result).toEqual([]);
    });

    it('validates multiple URLs in parallel and returns only accepted ones', async () => {
      jest
        .spyOn(global, 'fetch')
        .mockResolvedValueOnce({
          ok: true,
          headers: { get: () => 'image/jpeg' },
        } as unknown as Response)
        .mockResolvedValueOnce({
          ok: false,
          headers: { get: () => 'image/jpeg' },
        } as unknown as Response);

      const result = await service.validateImages([
        'https://example.com/good.jpg',
        'https://example.com/bad.jpg',
      ]);
      expect(result).toEqual(['https://example.com/good.jpg']);
    });
  });
});
