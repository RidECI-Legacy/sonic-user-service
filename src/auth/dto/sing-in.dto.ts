import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString } from 'class-validator';

export class SignInDto {
  @ApiProperty({ example: 'juan.perez@escuelaing.edu.co', description: 'Email del usuario' })
  @IsString()
  @IsNotEmpty()
  email!: string;

  @ApiProperty({ example: 'SecureP@ss123', description: 'Contraseña del usuario' })
  @IsString()
  @IsNotEmpty()
  password!: string;
}
