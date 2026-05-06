import { Test, TestingModule } from '@nestjs/testing';
import { OffersController } from './offers.controller';
import { OffersService } from './offers.service';

const mockOffersService = {
  processOffer: jest.fn(),
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

  it('returns ApiResponse with data from OffersService', async () => {
    const serviceResult = {
      product_id: 'EAN-123',
      accepted_images: ['https://example.com/img.jpg'],
      event_emitted: true,
    };
    mockOffersService.processOffer.mockResolvedValue(serviceResult);

    const result = await controller.createOffer({
      product_id: 'EAN-123',
      merchant_id: 'merchant-1',
      merchant_score: 85,
      image_urls: ['https://example.com/img.jpg'],
    });

    expect(result).toEqual({ data: serviceResult, error: null });
  });

  it('calls processOffer with the correct arguments', async () => {
    mockOffersService.processOffer.mockResolvedValue({
      product_id: 'EAN-123',
      accepted_images: [],
      event_emitted: false,
    });

    await controller.createOffer({
      product_id: 'EAN-123',
      merchant_id: 'merchant-1',
      merchant_score: 85,
      image_urls: ['https://example.com/img.jpg'],
    });

    expect(mockOffersService.processOffer).toHaveBeenCalledWith(
      'EAN-123',
      85,
      ['https://example.com/img.jpg'],
    );
  });
});
