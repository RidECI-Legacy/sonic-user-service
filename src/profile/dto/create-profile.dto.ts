import { IsDate, IsNotEmpty, IsString } from 'class-validator';
import type { DocumentType } from 'src/users/enums/document-type.enum';
import type { ProfileRole } from 'src/users/enums/profile-role.enum';

export class CreateProfileDto {
  @IsString()
  @IsNotEmpty()
  id!: string;
  @IsString()
  @IsNotEmpty()
  documenType!: DocumentType;
  @IsString()
  @IsNotEmpty()
  documentNumber!: string;
  @IsString()
  @IsNotEmpty()
  phone!: string;
  @IsString()
  @IsNotEmpty()
  role!: ProfileRole;
  @IsString()
  @IsNotEmpty()
  rate!: number;
  @IsDate()
  @IsNotEmpty()
  lastSession!: Date;
  @IsString()
  @IsNotEmpty()
  userId!: string;
}
