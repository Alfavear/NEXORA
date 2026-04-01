import { IsInt, IsNumber, IsPositive } from 'class-validator';

export class TransferItemDto {
  @IsInt()
  fromBranchId: number;

  @IsInt()
  toBranchId: number;

  @IsInt()
  itemId: number;

  @IsNumber()
  @IsPositive()
  quantity: number;
}
