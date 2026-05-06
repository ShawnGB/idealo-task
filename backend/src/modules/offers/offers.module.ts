import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ProductState } from './entities/product-state.entity';
import { OffersController } from './offers.controller';
import { OffersService } from './offers.service';
import { ImageValidatorService } from './image-validator.service';
import { GalleryEventService } from './gallery-event.service';

@Module({
  imports: [TypeOrmModule.forFeature([ProductState])],
  controllers: [OffersController],
  providers: [OffersService, ImageValidatorService, GalleryEventService],
})
export class OffersModule {}
