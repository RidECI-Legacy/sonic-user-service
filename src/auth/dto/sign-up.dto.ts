import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsEnum, IsNotEmpty, IsString } from 'class-validator';
import { DocumentType } from '../../users/enums/document-type.enum';

export class SignUpDto {
  @ApiProperty({ example: 'Juan Perez', description: 'Nombre completo del usuario' })
  @IsString()
  @IsNotEmpty()
  name!: string;

  @ApiProperty({ example: 'juan.perez@escuelaing.edu.co', description: 'Email del usuario' })
  @IsEmail()
  @IsNotEmpty()
  email!: string;

  @ApiProperty({ example: 'SecureP@ss123', description: 'Contraseña del usuario' })
  @IsString()
  @IsNotEmpty()
  password!: string;

  @ApiProperty({ enum: DocumentType, example: DocumentType.CC, description: 'Tipo de documento de identidad' })
  @IsNotEmpty()
  @IsEnum(DocumentType)
  documentType!: DocumentType;

  @ApiProperty({ example: '1234567890', description: 'Número de documento de identidad' })
  @IsNotEmpty()
  @IsString()
  documentNumber!: string;
}
