import { IsBoolean, IsOptional, IsString, MinLength } from 'class-validator';

export class UpdateItemOwnerDto {
  @IsOptional()
  @IsString()
  @MinLength(2)
  name?: string;

  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}
