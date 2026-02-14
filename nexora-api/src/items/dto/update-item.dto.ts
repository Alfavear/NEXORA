import { IsBoolean, IsEnum, IsInt, IsNumber, IsOptional, IsString, Min, MinLength } from 'class-validator';
import { ItemType } from './create-item.dto';

export class UpdateItemDto {
  @IsOptional()
  @IsString()
  @MinLength(2)
  name?: string;

  @IsOptional()
  @IsString()
  sku?: string;

  @IsOptional()
  @IsEnum(ItemType)
  type?: ItemType;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsNumber()
  @Min(0)
  basePrice?: number;

  @IsOptional()
  @IsInt()
  @Min(1)
  categoryId?: number;

  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}
