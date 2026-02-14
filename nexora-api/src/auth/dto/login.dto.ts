import { IsEmail, IsInt, IsOptional, IsString, Min } from 'class-validator';

export class LoginDto {
  @IsEmail()
  email: string;

  @IsString()
  password: string;

  @IsOptional()
  @IsInt()
  @Min(1)
  branchId?: number;
}
