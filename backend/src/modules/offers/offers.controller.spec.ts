import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException } from '@nestjs/common';
import { OffersController } from './offers.controller';
import { OffersService } from './offers.service';

const mockOffersService = {
  processOffer: jest.fn(),
  getProductGallery: jest.fn(),
};

describe('OffersController', () => {
  let controller: OffersController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [OffersController],
      providers: [{ provide: OffersService, useValue: mockOffersService }],
    }).compile();

    controller = module.get<OffersController>(OffersController);
    jest.clearAllMocks();
  });

  describe('createOffer', () => {
    it('returns ApiResponse with data from OffersService', async () => {
      const serviceResult = {
        product_id: 'EAN-123',
        accepted_images: ['https://example.com/img.jpg'],
        event_emitted: true,
        reason: 'first_images' as const,
      };
      mockOffersService.processOffer.mockResolvedValue(serviceResult);

      const result = await controller.createOffer({
        product_id: 'EAN-123',
        merchant_id: 'merchant-1',
        merchant_score: 85,
        images: ['https://example.com/img.jpg'],
      });

      expect(result).toEqual({ data: serviceResult, error: null });
    });

    it('calls processOffer with the correct arguments', async () => {
      mockOffersService.processOffer.mockResolvedValue({
        product_id: 'EAN-123',
        accepted_images: [],
        event_emitted: false,
        reason: null,
      });

      await controller.createOffer({
        product_id: 'EAN-123',
        merchant_id: 'merchant-1',
        merchant_score: 85,
        images: ['https://example.com/img.jpg'],
      });

      expect(mockOffersService.processOffer).toHaveBeenCalledWith(
        'EAN-123',
        85,
        ['https://example.com/img.jpg'],
      );
    });
  });

  describe('getProductGallery', () => {
    it('returns ApiResponse<ProductGallery> when product exists', async () => {
      const gallery: ProductGallery = {
        product_id: 'EAN-123',
        images: ['https://example.com/img.jpg'],
        updatedAt: '2026-05-06T00:00:00.000Z',
      };
      mockOffersService.getProductGallery.mockResolvedValue(gallery);

      const result = await controller.getProductGallery('EAN-123');

      expect(result).toEqual({ data: gallery, error: null });
    });

    it('propagates NotFoundException from service', async () => {
      mockOffersService.getProductGallery.mockRejectedValue(
        new NotFoundException('Product EAN-999 not found'),
      );

      await expect(controller.getProductGallery('EAN-999')).rejects.toThrow(
        NotFoundException,
      );
    });
  });
});
