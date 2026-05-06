import { Body, Controller, HttpCode, Post } from '@nestjs/common';
import { OffersService, ProcessOfferResult } from './offers.service';
import { CreateOfferDto } from './dto/create-offer.dto';

@Controller('offers')
export class OffersController {
  constructor(private readonly offersService: OffersService) {}

  @Post()
  @HttpCode(200)
  async createOffer(
    @Body() dto: CreateOfferDto,
  ): Promise<ApiResponse<ProcessOfferResult>> {
    const data = await this.offersService.processOffer(
      dto.product_id,
      dto.merchant_score,
      dto.image_urls,
    );
    return { data, error: null };
  }
}
