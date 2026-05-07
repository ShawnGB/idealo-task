import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import request from 'supertest';
import { App } from 'supertest/types';
import { AppModule } from './../src/app.module';
import { HttpExceptionFilter } from './../src/filters/http-exception.filter';
import { GalleryEventService } from './../src/modules/offers/gallery-event.service';

describe('HelloController (e2e)', () => {
  let app: INestApplication<App>;

  beforeEach(async () => {
    process.env.DATABASE_PATH = ':memory:';

    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    app.setGlobalPrefix('api');
    app.useGlobalFilters(new HttpExceptionFilter());
    app.useGlobalPipes(new ValidationPipe({ whitelist: true }));
    await app.init();
  });

  afterEach(async () => {
    await app.close();
    delete process.env.DATABASE_PATH;
  });

  it('GET /api/hello returns HelloMessage', () => {
    return request(app.getHttpServer())
      .get('/api/hello')
      .expect(200)
      .expect({ message: 'Hello from NestJS!' });
  });

  it('GET /api/unknown returns 404 ApiError shape', () => {
    return request(app.getHttpServer())
      .get('/api/unknown')
      .expect(404)
      .expect((res) => {
        expect(res.body).toMatchObject({
          message: expect.any(String),
          code: 'NOT_FOUND',
          statusCode: 404,
        });
      });
  });
});

describe('OffersController (e2e)', () => {
  let app: INestApplication<App>;
  let emitSpy: jest.SpyInstance;

  beforeEach(async () => {
    process.env.DATABASE_PATH = ':memory:';

    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    app.setGlobalPrefix('api');
    app.useGlobalFilters(new HttpExceptionFilter());
    app.useGlobalPipes(new ValidationPipe({ whitelist: true }));
    await app.init();

    const galleryEvent =
      moduleFixture.get<GalleryEventService>(GalleryEventService);
    emitSpy = jest.spyOn(galleryEvent, 'emit').mockResolvedValue(undefined);

    jest.spyOn(global, 'fetch').mockResolvedValue({
      ok: true,
      headers: { get: () => 'image/jpeg' },
    } as unknown as Response);
  });

  afterEach(async () => {
    await app.close();
    jest.restoreAllMocks();
    delete process.env.DATABASE_PATH;
  });

  it('POST /api/offers returns 201 with accepted images and emits gallery:update', async () => {
    await request(app.getHttpServer())
      .post('/api/offers')
      .send({
        offer_id: 'offer-123',
        product_id: 'EAN-123',
        merchant_id: 'merchant-1',
        merchant_score: 85,
        images: ['https://example.com/img.jpg'],
      })
      .expect(201)
      .expect((res) => {
        expect(res.body).toMatchObject({
          data: {
            product_id: 'EAN-123',
            accepted_images: ['https://example.com/img.jpg'],
            event_emitted: true,
          },
          error: null,
        });
      });

    expect(emitSpy).toHaveBeenCalledWith(
      expect.objectContaining({
        event_type: 'gallery:update',
        product_id: 'EAN-123',
        images: ['https://example.com/img.jpg'],
        reason: 'first_images',
        triggered_at: expect.any(String),
      }),
    );
  });

  it('POST /api/offers returns 400 with VALIDATION_ERROR for invalid payload', async () => {
    await request(app.getHttpServer())
      .post('/api/offers')
      .send({ product_id: '', merchant_score: 'not-a-number' })
      .expect(400)
      .expect((res) => {
        expect(res.body).toMatchObject({
          code: 'VALIDATION_ERROR',
          statusCode: 400,
        });
      });
  });

  it('POST /api/offers returns 201 with empty accepted_images and no event when all URLs fail HEAD check', async () => {
    jest.restoreAllMocks();
    jest.spyOn(global, 'fetch').mockResolvedValue({
      ok: false,
      status: 400,
      headers: { get: () => 'text/html' },
    } as unknown as Response);

    const galleryEvent = app.get<GalleryEventService>(GalleryEventService);
    emitSpy = jest.spyOn(galleryEvent, 'emit');

    await request(app.getHttpServer())
      .post('/api/offers')
      .send({
        product_id: 'EAN-456',
        merchant_id: 'merchant-2',
        merchant_score: 70,
        images: ['https://example.com/broken.jpg'],
      })
      .expect(201)
      .expect((res) => {
        expect(res.body).toMatchObject({
          data: {
            product_id: 'EAN-456',
            accepted_images: [],
            event_emitted: false,
          },
          error: null,
        });
      });

    expect(emitSpy).not.toHaveBeenCalled();
  });
});
