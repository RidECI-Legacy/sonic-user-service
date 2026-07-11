import { ApiProperty } from '@nestjs/swagger';
import { IsDate, IsNotEmpty, IsNumber, IsString } from 'class-validator';
import type { DocumentType } from 'src/users/enums/document-type.enum';
import type { ProfileRole } from 'src/users/enums/profile-role.enum';

export class CreateProfileDto {
  @ApiProperty({ example: 'uuid-1234-5678', description: 'ID único del perfil' })
  @IsString()
  @IsNotEmpty()
  id!: string;

  @ApiProperty({ example: 'CC', description: 'Tipo de documento de identidad' })
  @IsString()
  @IsNotEmpty()
  documenType!: DocumentType;

  @ApiProperty({ example: '1234567890', description: 'Número de documento de identidad' })
  @IsString()
  @IsNotEmpty()
  documentNumber!: string;

  @ApiProperty({ example: '+57 300 1234567', description: 'Número de teléfono del usuario' })
  @IsString()
  @IsNotEmpty()
  phone!: string;

  @ApiProperty({ example: 'driver', description: 'Rol del perfil (driver, passenger, companion)' })
  @IsString()
  @IsNotEmpty()
  role!: ProfileRole;

  @ApiProperty({ example: 4.5, description: 'Calificación promedio del usuario' })
  @IsNumber()
  @IsNotEmpty()
  rate!: number;

  @ApiProperty({ example: '2026-07-09T17:00:00Z', description: 'Fecha y hora de la última sesión' })
  @IsDate()
  @IsNotEmpty()
  lastSession!: Date;

  @ApiProperty({ example: 'uuid-1234-5678', description: 'ID del usuario asociado al perfil' })
  @IsString()
  @IsNotEmpty()
  userId!: string;
}
