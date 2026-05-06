import { GalleryEventService, GalleryUpdateEvent } from './gallery-event.service';

const mockEvent: GalleryUpdateEvent = {
  event_type: 'gallery:update',
  product_id: 'EAN-123',
  triggered_at: '2026-05-06T00:00:00.000Z',
  images: ['https://example.com/img.jpg'],
  reason: 'first_images',
};

describe('GalleryEventService', () => {
  let fetchSpy: jest.SpyInstance;

  afterEach(() => {
    jest.restoreAllMocks();
    delete process.env.GALLERY_WEBHOOK_URL;
  });

  describe('when GALLERY_WEBHOOK_URL is set', () => {
    let service: GalleryEventService;

    beforeEach(() => {
      process.env.GALLERY_WEBHOOK_URL = 'https://webhook.example.com/gallery';
      service = new GalleryEventService();
      fetchSpy = jest.spyOn(global, 'fetch').mockResolvedValue({
        ok: true,
      } as Response);
    });

    it('POSTs the event as JSON to the configured webhook URL', async () => {
      await service.emit(mockEvent);
      expect(fetchSpy).toHaveBeenCalledWith(
        'https://webhook.example.com/gallery',
        expect.objectContaining({
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(mockEvent),
        }),
      );
    });

    it('resolves without throwing when the POST fails', async () => {
      fetchSpy.mockRejectedValue(new Error('network error'));
      await expect(service.emit(mockEvent)).resolves.toBeUndefined();
    });
  });

  describe('when GALLERY_WEBHOOK_URL is not set', () => {
    let service: GalleryEventService;

    beforeEach(() => {
      service = new GalleryEventService();
      fetchSpy = jest.spyOn(global, 'fetch');
    });

    it('logs the event to stdout and does not call fetch', async () => {
      await service.emit(mockEvent);
      expect(fetchSpy).not.toHaveBeenCalled();
    });
  });
});
