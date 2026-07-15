import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsNotEmpty, IsString } from 'class-validator';

export class LoginDto {
  @ApiProperty({ example: 'juan.perez@escuelaing.edu.co', description: 'Email del usuario' })
  @IsEmail()
  @IsNotEmpty()
  email!: string;

  @ApiProperty({ example: 'SecureP@ss123', description: 'Contraseña del usuario' })
  @IsString()
  @IsNotEmpty()
  password!: string;
}
