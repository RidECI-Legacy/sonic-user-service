import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsNotEmpty } from 'class-validator';

export class ForgotPasswordDto {
  @ApiProperty({ example: 'juan.perez@escuelaing.edu.co', description: 'Email del usuario' })
  @IsEmail()
  @IsNotEmpty()
  email!: string;
}
