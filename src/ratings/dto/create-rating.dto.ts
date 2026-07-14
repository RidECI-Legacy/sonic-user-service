import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { ProfileRole } from '@prisma/client';
import {
  IsEnum,
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsString,
  Max,
  MaxLength,
  Min,
} from 'class-validator';

export class CreateRatingDto {
  @ApiProperty({
    example: 'uuid-trip-1234',
    description:
      'ID del viaje (referencia externa, gestionado por otro microservicio)',
  })
  @IsString()
  @IsNotEmpty()
  tripId!: string;

  @ApiProperty({
    example: 'uuid-1234-5678',
    description: 'ID del usuario calificado',
  })
  @IsString()
  @IsNotEmpty()
  ratedUserId!: string;

  @ApiProperty({
    enum: ProfileRole,
    example: ProfileRole.DRIVER,
    description: 'Rol del usuario calificado en este viaje',
  })
  @IsEnum(ProfileRole)
  role!: ProfileRole;

  @ApiProperty({
    minimum: 1,
    maximum: 5,
    example: 5,
    description: 'Calificación en estrellas (1-5)',
  })
  @IsInt()
  @Min(1)
  @Max(5)
  stars!: number;

  @ApiPropertyOptional({
    example: 'Excelente viaje, muy puntual.',
    description: 'Comentario opcional',
  })
  @IsOptional()
  @IsString()
  @MaxLength(1000)
  comment?: string;
}
