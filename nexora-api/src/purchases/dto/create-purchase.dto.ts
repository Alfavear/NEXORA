import { Type } from 'class-transformer';
import { IsArray, IsInt, IsOptional, IsString, Min, ValidateNested, IsNumber } from 'class-validator';

export class CreatePurchaseDetailDto {
  @IsInt()
  @Min(1)
  itemId: number;

  @IsNumber()
  @Min(0.01)
  quantity: number;

  @IsNumber()
  @Min(0)
  unitCost: number;
}

export class CreatePurchaseDto {
  @IsInt()
  @Min(1)
  branchId: number;

  @IsInt()
  @Min(1)
  supplierId: number;

  @IsString()
  systemNumber: string;

  @IsOptional()
  @IsString()
  supplierInvoiceNumber?: string;

  @IsOptional()
  @IsString()
  notes?: string;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CreatePurchaseDetailDto)
  details: CreatePurchaseDetailDto[];
}
