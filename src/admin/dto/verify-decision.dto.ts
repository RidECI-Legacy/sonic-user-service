import { IsEnum, IsOptional, IsString } from 'class-validator';

export class VerifyDecisionDto {
  @IsEnum(['VERIFIED', 'REJECTED'] as const)
  status!: 'VERIFIED' | 'REJECTED';

  @IsOptional()
  @IsString()
  rejectionReason?: string;
}
