import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { HelloModule } from './modules/hello/hello.module';
import { OffersModule } from './modules/offers/offers.module';

@Module({
  imports: [
    TypeOrmModule.forRoot({
      type: 'better-sqlite3',
      database: process.env.DATABASE_PATH ?? 'data/gallery.db',
      synchronize: true,
      autoLoadEntities: true,
    }),
    HelloModule,
    OffersModule,
  ],
})
export class AppModule {}
