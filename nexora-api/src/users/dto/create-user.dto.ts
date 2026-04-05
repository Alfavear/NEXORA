import {
  IsEmail,
  IsInt,
  IsString,
  Min,
  MinLength,
  ArrayMinSize,
  IsArray,
  IsOptional,
} from 'class-validator';

export class CreateUserDto {
  @IsString()
  name: string;

  @IsEmail()
  email: string;

  @IsString()
  @IsOptional()
  username?: string;

  @IsString()
  @MinLength(6)
  password: string;

  @IsInt()
  @Min(1)
  roleId: number;

  @IsArray()
  @ArrayMinSize(1)
  @IsInt({ each: true })
  @Min(1, { each: true })
  branchIds: number[];
}
