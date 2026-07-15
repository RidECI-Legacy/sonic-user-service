import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsEnum, IsOptional, IsString } from 'class-validator';

export class VerifyDecisionDto {
  @ApiProperty({
    enum: ['VERIFIED', 'REJECTED'],
    example: 'VERIFIED',
    description: 'Decisión de verificación del conductor',
  })
  @IsEnum(['VERIFIED', 'REJECTED'] as const)
  status!: 'VERIFIED' | 'REJECTED';

  @ApiPropertyOptional({
    example: 'Documento ilegible',
    description: 'Razón de rechazo (solo requerido si status es REJECTED)',
  })
  @IsOptional()
  @IsString()
  rejectionReason?: string;
}
