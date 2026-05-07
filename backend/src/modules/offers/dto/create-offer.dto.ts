import { IsArray, IsNotEmpty, IsNumber, IsOptional, IsString } from 'class-validator';

export class CreateOfferDto {
  @IsString()
  @IsOptional()
  offer_id?: string;

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
  images: string[];
}
