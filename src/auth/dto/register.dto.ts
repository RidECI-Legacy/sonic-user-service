import { ApiProperty } from '@nestjs/swagger';
import {
  IsEmail,
  IsEnum,
  IsNotEmpty,
  IsString,
  Matches,
} from 'class-validator';
import { DocumentType } from '../../users/enums/document-type.enum';

const ECI_DOMAINS = '@escuelaing\\.edu\\.co|@mail\\.escuelaing\\.edu\\.co';

export class RegisterDto {
  @ApiProperty({ example: 'Juan Perez', description: 'Nombre completo del usuario' })
  @IsString()
  @IsNotEmpty()
  name!: string;

  @ApiProperty({ example: 'juan.perez@escuelaing.edu.co', description: 'Email institucional ECI (@escuelaing.edu.co o @mail.escuelaing.edu.co)' })
  @IsEmail()
  @IsNotEmpty()
  @Matches(new RegExp(`^[a-zA-Z0-9._%+-]+(${ECI_DOMAINS})$`), {
    message:
      'El email debe pertenecer al dominio ECI (@escuelaing.edu.co o @mail.escuelaing.edu.co)',
  })
  email!: string;

  @ApiProperty({ example: 'SecureP@ss123', description: 'Contraseña del usuario' })
  @IsString()
  @IsNotEmpty()
  password!: string;

  @ApiProperty({ example: '+573001234567', description: 'Número de celular del usuario' })
  @IsString()
  @IsNotEmpty()
  @Matches(/^\+?[0-9]{10,15}$/, {
    message: 'El número de celular debe tener entre 10 y 15 dígitos',
  })
  phone!: string;

  @ApiProperty({ enum: DocumentType, example: DocumentType.CC, description: 'Tipo de documento de identidad' })
  @IsEnum(DocumentType)
  @IsNotEmpty()
  documentType!: DocumentType;

  @ApiProperty({ example: '1234567890', description: 'Número de documento de identidad' })
  @IsString()
  @IsNotEmpty()
  documentNumber!: string;

  @ApiProperty({ example: '2021001234', description: 'ID de estudiante de la universidad' })
  @IsString()
  @IsNotEmpty()
  studentId!: string;
}
