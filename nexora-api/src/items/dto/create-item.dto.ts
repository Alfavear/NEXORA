import { IsEnum, IsInt, IsNumber, IsOptional, IsString, Min, MinLength } from 'class-validator';

export enum ItemType {
  MUEBLE = 'MUEBLE',
  INSUMO = 'INSUMO',
}

export class CreateItemDto {
  @IsString()
  @MinLength(2)
  name: string;

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

  @IsInt()
  @Min(1)
  categoryId: number;
}
