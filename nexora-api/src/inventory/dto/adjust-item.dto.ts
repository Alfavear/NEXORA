import { Type } from 'class-transformer';
import { IsInt, IsNumber, IsOptional, IsString, Min } from 'class-validator';

export class AdjustItemDto {
  @IsInt()
  @Min(1)
  itemId: number;

  @IsOptional()
  @IsInt()
  @Min(1)
  branchId?: number;

  @Type(() => Number)
  @IsNumber()
  quantity: number;

  @IsOptional()
  @IsString()
  reason?: string;

  @IsOptional()
  @IsString()
  notes?: string;
}

export class ApproveAdjustmentDto {
  @IsOptional()
  @IsString()
  notes?: string;

  @IsOptional()
  approved?: boolean;
}
