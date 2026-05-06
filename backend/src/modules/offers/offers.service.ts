import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ProductState } from './entities/product-state.entity';
import { ImageValidatorService } from './image-validator.service';
import { GalleryEventService } from './gallery-event.service';
import { ImageCandidate, mergeAndRank, determineTrigger } from './ranking';

export interface ProcessOfferResult {
  product_id: string;
  accepted_images: string[];
  event_emitted: boolean;
}

@Injectable()
export class OffersService {
  constructor(
    @InjectRepository(ProductState)
    private readonly productStateRepo: Repository<ProductState>,
    private readonly imageValidator: ImageValidatorService,
    private readonly galleryEvent: GalleryEventService,
  ) {}

  async processOffer(
    productId: string,
    merchantScore: number,
    imageUrls: string[],
  ): Promise<ProcessOfferResult> {
    const accepted = await this.imageValidator.validateImages(imageUrls);

    const existing = await this.productStateRepo.findOne({
      where: { productId },
    });
    const previousCandidates: ImageCandidate[] = existing?.candidates ?? [];

    const incoming: ImageCandidate[] = accepted.map((url) => ({
      url,
      imageCount: accepted.length,
      merchantScore,
    }));

    const merged = mergeAndRank(previousCandidates, incoming);
    const reason = determineTrigger(previousCandidates, merged);

    await this.productStateRepo.save({
      productId,
      candidates: merged,
      updatedAt: new Date(),
    });

    if (reason) {
      await this.galleryEvent.emit({
        event_type: 'gallery:update',
        product_id: productId,
        triggered_at: new Date().toISOString(),
        images: merged.map((c) => c.url),
        reason,
      });
    }

    return {
      product_id: productId,
      accepted_images: accepted,
      event_emitted: reason !== null,
    };
  }
}
