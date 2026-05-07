import { Injectable, Logger } from '@nestjs/common';
import { GalleryUpdateReason } from './gallery-triggers';

export interface GalleryUpdateEvent {
  event_type: 'gallery:update';
  product_id: string;
  triggered_at: string;
  images: string[];
  reason: GalleryUpdateReason;
}

@Injectable()
export class GalleryEventService {
  private readonly logger = new Logger(GalleryEventService.name);
  private readonly webhookUrl = process.env.GALLERY_WEBHOOK_URL;

  async emit(event: GalleryUpdateEvent): Promise<void> {
    if (!this.webhookUrl) {
      this.logger.log(JSON.stringify(event));
      return;
    }
    try {
      await fetch(this.webhookUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(event),
      });
    } catch (err) {
      this.logger.error('Failed to POST gallery:update event', err);
    }
  }
}
