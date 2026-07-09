import { IsEmail, IsEnum, IsNotEmpty, IsString } from 'class-validator';
import { DocumentType } from '../../users/enums/document-type.enum';
export class SignUpDto {
  @IsString()
  @IsNotEmpty()
  name!: string;
  @IsEmail()
  @IsNotEmpty()
  email!: string;
  @IsString()
  @IsNotEmpty()
  password!: string;
  @IsNotEmpty()
  @IsEnum(DocumentType)
  documentType!: DocumentType;
  @IsNotEmpty()
  @IsString()
  documentNumber!: string;
}
