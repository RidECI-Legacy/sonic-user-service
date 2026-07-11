import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsNotEmpty, IsString } from 'class-validator';
import type { UserType } from '../enums/user-type.enums';

export class CreateUserDto {
  @ApiProperty({ example: 'uuid-1234-5678', description: 'ID único del usuario (UUID de Supabase)' })
  @IsString()
  @IsNotEmpty()
  id!: string;

  @ApiProperty({ example: 'Juan Perez', description: 'Nombre completo del usuario' })
  @IsString()
  @IsNotEmpty()
  name!: string;

  @ApiProperty({ example: 'juan.perez@escuelaing.edu.co', description: 'Email del usuario' })
  @IsEmail()
  @IsString()
  @IsNotEmpty()
  email!: string;

  @ApiProperty({ example: 'STUDENT', description: 'Rol del usuario' })
  @IsString()
  @IsNotEmpty()
  role!: UserType;
}
