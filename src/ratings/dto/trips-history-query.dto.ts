import { ApiPropertyOptional } from '@nestjs/swagger';
import { ProfileRole } from '@prisma/client';
import { Type } from 'class-transformer';
import {
  IsDateString,
  IsEnum,
  IsInt,
  IsOptional,
  Max,
  Min,
} from 'class-validator';

export class TripsHistoryQueryDto {
  @ApiPropertyOptional({
    default: 1,
    minimum: 1,
    description: 'Número de página',
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page?: number = 1;

  @ApiPropertyOptional({
    default: 10,
    minimum: 1,
    maximum: 50,
    description: 'Resultados por página',
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(50)
  limit?: number = 10;

  @ApiPropertyOptional({
    enum: ProfileRole,
    description: 'Filtra por rol jugado en el viaje',
  })
  @IsOptional()
  @IsEnum(ProfileRole)
  role?: ProfileRole;

  @ApiPropertyOptional({
    description: 'Filtra viajes desde esta fecha (ISO 8601)',
  })
  @IsOptional()
  @IsDateString()
  fromDate?: string;

  @ApiPropertyOptional({
    description: 'Filtra viajes hasta esta fecha (ISO 8601)',
  })
  @IsOptional()
  @IsDateString()
  toDate?: string;
}
