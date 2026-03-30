import { Type } from 'class-transformer';
import { ArrayMinSize, IsArray, IsInt, IsNumber, Min, ValidateNested } from 'class-validator';

class ReturnItemDto {
  @IsInt()
  itemId: number;

  @Type(() => Number)
  @IsNumber()
  @Min(0.01)
  quantity: number;
}

export class CreateReturnDto {
  @IsArray()
  @ArrayMinSize(1)
  @ValidateNested({ each: true })
  @Type(() => ReturnItemDto)
  items: ReturnItemDto[];
}
