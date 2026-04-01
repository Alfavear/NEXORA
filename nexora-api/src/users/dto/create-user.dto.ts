import {
  IsEmail,
  IsInt,
  IsString,
  Min,
  MinLength,
  ArrayMinSize,
  IsArray,
} from 'class-validator';

export class CreateUserDto {
  @IsString()
  name: string;

  @IsEmail()
  email: string;

  @IsString()
  @MinLength(6)
  password: string;

  @IsArray()
  @ArrayMinSize(1)
  @IsInt({ each: true })
  @Min(1, { each: true })
  branchIds: number[];
}
