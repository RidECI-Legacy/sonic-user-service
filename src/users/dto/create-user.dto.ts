import { IsEmail, IsNotEmpty, IsString } from 'class-validator';
import type { UserType } from '../enums/user-type.enums';

export class CreateUserDto {
  @IsString()
  @IsNotEmpty()
  id!: string;
  @IsString()
  @IsNotEmpty()
  name!: string;
  @IsEmail()
  @IsString()
  @IsNotEmpty()
  email!: string;
  @IsString()
  @IsNotEmpty()
  role!: UserType;
}
