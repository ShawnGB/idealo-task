import { IsArray, IsNotEmpty, IsNumber, IsString } from 'class-validator';

export class CreateOfferDto {
  @IsString()
  @IsNotEmpty()
  product_id: string;

  @IsString()
  @IsNotEmpty()
  merchant_id: string;

  @IsNumber()
  merchant_score: number;

  @IsArray()
  @IsString({ each: true })
  image_urls: string[];
}
