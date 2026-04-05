import { IsEmail, IsInt, IsNotEmpty, IsOptional, IsString, Min } from 'class-validator';

export class LoginDto {
  @IsString()
  @IsNotEmpty()
  email: string;

  @IsString()
  password: string;

  @IsOptional()
  @IsInt()
  @Min(1)
  branchId?: number;
}
