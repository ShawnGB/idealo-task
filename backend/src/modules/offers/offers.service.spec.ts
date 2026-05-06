import { Test } from '@nestjs/testing';
import { NotFoundException } from '@nestjs/common';
import { getRepositoryToken } from '@nestjs/typeorm';
import { OffersService } from './offers.service';
import { ProductState } from './entities/product-state.entity';
import { ImageValidatorService } from './image-validator.service';
import { GalleryEventService } from './gallery-event.service';

const mockRepo = {
  findOne: jest.fn(),
  save: jest.fn(),
};

const mockImageValidator = {
  validateImages: jest.fn(),
};

const mockGalleryEvent = {
  emit: jest.fn(),
};

describe('OffersService', () => {
  let service: OffersService;

  beforeEach(async () => {
    const module = await Test.createTestingModule({
      providers: [
        OffersService,
        { provide: getRepositoryToken(ProductState), useValue: mockRepo },
        { provide: ImageValidatorService, useValue: mockImageValidator },
        { provide: GalleryEventService, useValue: mockGalleryEvent },
      ],
    }).compile();

    service = module.get<OffersService>(OffersService);

    jest.clearAllMocks();
    mockRepo.findOne.mockResolvedValue(null);
    mockRepo.save.mockResolvedValue(undefined);
    mockImageValidator.validateImages.mockResolvedValue([]);
    mockGalleryEvent.emit.mockResolvedValue(undefined);
  });

  it('returns accepted_images from ImageValidatorService', async () => {
    mockImageValidator.validateImages.mockResolvedValue([
      'https://example.com/img.jpg',
    ]);

    const result = await service.processOffer('EAN-1', 80, [
      'https://example.com/img.jpg',
    ]);

    expect(result.accepted_images).toEqual(['https://example.com/img.jpg']);
    expect(result.product_id).toBe('EAN-1');
    expect(result.reason).toBe('first_images');
  });

  it('saves merged candidates to the repository', async () => {
    mockImageValidator.validateImages.mockResolvedValue([
      'https://example.com/img.jpg',
    ]);

    await service.processOffer('EAN-1', 80, ['https://example.com/img.jpg']);

    expect(mockRepo.save).toHaveBeenCalledWith(
      expect.objectContaining({
        productId: 'EAN-1',
        candidates: [
          expect.objectContaining({
            url: 'https://example.com/img.jpg',
            merchantScore: 80,
            imageCount: 1,
          }),
        ],
      }),
    );
  });

  it('emits gallery:update with reason first_images on first valid offer', async () => {
    mockImageValidator.validateImages.mockResolvedValue([
      'https://example.com/img.jpg',
    ]);

    const result = await service.processOffer('EAN-1', 80, [
      'https://example.com/img.jpg',
    ]);

    expect(mockGalleryEvent.emit).toHaveBeenCalledWith(
      expect.objectContaining({
        event_type: 'gallery:update',
        product_id: 'EAN-1',
        images: ['https://example.com/img.jpg'],
        reason: 'first_images',
      }),
    );
    expect(result.event_emitted).toBe(true);
  });

  it('does not emit when no valid images are accepted', async () => {
    mockImageValidator.validateImages.mockResolvedValue([]);

    const result = await service.processOffer('EAN-1', 80, []);

    expect(mockGalleryEvent.emit).not.toHaveBeenCalled();
    expect(result.event_emitted).toBe(false);
    expect(result.reason).toBeNull();
  });

  it('does not emit when candidate set is unchanged', async () => {
    mockRepo.findOne.mockResolvedValue({
      productId: 'EAN-1',
      candidates: [
        { url: 'https://example.com/img.jpg', imageCount: 1, merchantScore: 80 },
      ],
      updatedAt: new Date(),
    });
    mockImageValidator.validateImages.mockResolvedValue([
      'https://example.com/img.jpg',
    ]);

    const result = await service.processOffer('EAN-1', 80, [
      'https://example.com/img.jpg',
    ]);

    expect(mockGalleryEvent.emit).not.toHaveBeenCalled();
    expect(result.event_emitted).toBe(false);
  });

  it('emits top_image_changed when a new offer displaces the top candidate', async () => {
    mockRepo.findOne.mockResolvedValue({
      productId: 'EAN-1',
      candidates: [
        { url: 'https://example.com/old.jpg', imageCount: 1, merchantScore: 50 },
      ],
      updatedAt: new Date(),
    });
    mockImageValidator.validateImages.mockResolvedValue([
      'https://example.com/new.jpg',
    ]);

    await service.processOffer('EAN-1', 90, ['https://example.com/new.jpg']);

    expect(mockGalleryEvent.emit).toHaveBeenCalledWith(
      expect.objectContaining({ reason: 'top_image_changed' }),
    );
  });

  it('emits merchant_added when a new URL enters top-5 without changing top-1', async () => {
    mockRepo.findOne.mockResolvedValue({
      productId: 'EAN-1',
      candidates: [
        { url: 'https://example.com/1.jpg', imageCount: 3, merchantScore: 90 },
      ],
      updatedAt: new Date(),
    });
    mockImageValidator.validateImages.mockResolvedValue([
      'https://example.com/2.jpg',
    ]);

    await service.processOffer('EAN-1', 50, ['https://example.com/2.jpg']);

    expect(mockGalleryEvent.emit).toHaveBeenCalledWith(
      expect.objectContaining({ reason: 'merchant_added' }),
    );
  });

  describe('getProductGallery', () => {
    it('returns mapped ProductGallery when product exists', async () => {
      mockRepo.findOne.mockResolvedValue({
        productId: 'EAN-1',
        candidates: [
          { url: 'https://example.com/img.jpg', imageCount: 1, merchantScore: 80 },
        ],
        updatedAt: new Date('2026-05-06T00:00:00.000Z'),
      });

      const result = await service.getProductGallery('EAN-1');

      expect(result).toEqual({
        product_id: 'EAN-1',
        images: ['https://example.com/img.jpg'],
        updatedAt: '2026-05-06T00:00:00.000Z',
      });
    });

    it('throws NotFoundException when product does not exist', async () => {
      mockRepo.findOne.mockResolvedValue(null);

      await expect(service.getProductGallery('EAN-999')).rejects.toThrow(
        NotFoundException,
      );
    });
  });
});
