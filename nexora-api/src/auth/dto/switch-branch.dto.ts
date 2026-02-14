import { IsInt, Min } from 'class-validator';

export class SwitchBranchDto {
  @IsInt()
  @Min(1)
  branchId: number;
}
