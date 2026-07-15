import { ApiPropertyOptional } from '@nestjs/swagger';
import { DocumentType } from '@prisma/client';
import { IsEnum, IsOptional, IsString } from 'class-validator';

export class UpdateProfileSelfDto {
  @ApiPropertyOptional({
    example: 'Juan Perez',
    description: 'Nombre completo del usuario',
  })
  @IsOptional()
  @IsString()
  name?: string;

  @ApiPropertyOptional({
    example: '+57 300 1234567',
    description: 'Teléfono del usuario',
  })
  @IsOptional()
  @IsString()
  phone?: string;

  @ApiPropertyOptional({
    enum: DocumentType,
    example: DocumentType.CC,
    description: 'Tipo de documento de identidad',
  })
  @IsOptional()
  @IsEnum(DocumentType)
  documentType?: DocumentType;
}
