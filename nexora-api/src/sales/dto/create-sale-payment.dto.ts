import { IsNumber, IsOptional, IsString, Min, IsInt } from 'class-validator';
import { Type } from 'class-transformer';

export class CreateSalePaymentDto {
  @Type(() => Number)
  @IsNumber()
  @Min(0.01)
  amount: number;

  @IsInt()
  @Min(1)
  paymentMethodId: number;

  @IsOptional()
  @IsString()
  notes?: string;
}
