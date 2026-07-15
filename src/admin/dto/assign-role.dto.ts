import { ApiProperty } from '@nestjs/swagger';
import { IsEnum } from 'class-validator';

export class AssignRoleDto {
  @ApiProperty({
    enum: ['STUDENT', 'TEACHER_ADMINISTRATIVE'],
    example: 'STUDENT',
    description:
      'Rol a asignar (no incluye ADMIN, se asigna manualmente por fuera de este endpoint)',
  })
  @IsEnum(['STUDENT', 'TEACHER_ADMINISTRATIVE'] as const)
  role!: 'STUDENT' | 'TEACHER_ADMINISTRATIVE';
}
