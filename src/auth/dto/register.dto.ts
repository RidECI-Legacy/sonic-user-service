import {
  IsEmail,
  IsEnum,
  IsNotEmpty,
  IsString,
  Matches,
} from 'class-validator';
import { DocumentType } from '../../users/enums/document-type.enum';
import { UserType } from '../../users/enums/user-type.enums';

const ECI_DOMAINS = '@escuelaing\\.edu\\.co|@mail\\.escuelaing\\.edu\\.co';

export class RegisterDto {
  @IsString()
  @IsNotEmpty()
  name!: string;

  @IsEmail()
  @IsNotEmpty()
  @Matches(new RegExp(`^[a-zA-Z0-9._%+-]+(${ECI_DOMAINS})$`), {
    message:
      'El email debe pertenecer al dominio ECI (@escuelaing.edu.co o @mail.escuelaing.edu.co)',
  })
  email!: string;

  @IsString()
  @IsNotEmpty()
  password!: string;

  @IsEnum(UserType)
  @IsNotEmpty()
  role!: UserType;

  @IsEnum(DocumentType)
  @IsNotEmpty()
  documentType!: DocumentType;

  @IsString()
  @IsNotEmpty()
  documentNumber!: string;
}
