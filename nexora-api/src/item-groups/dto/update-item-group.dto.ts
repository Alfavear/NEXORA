import { IsBoolean, IsOptional, IsString, MinLength } from 'class-validator';

export class UpdateItemGroupDto {
  @IsOptional()
  @IsString()
  @MinLength(2)
  name?: string;

  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}
