import { ApiProperty } from '@nestjs/swagger';
import { IsEnum } from 'class-validator';

export class UpdateUserStatusDto {
  @ApiProperty({
    enum: ['activo', 'suspendido'],
    example: 'suspendido',
    description: 'Nuevo estado del usuario',
  })
  @IsEnum(['activo', 'suspendido'] as const)
  status!: 'activo' | 'suspendido';
}
