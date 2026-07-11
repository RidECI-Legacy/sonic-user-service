import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString, MinLength } from 'class-validator';

export class ResetPasswordDto {
  @ApiProperty({ description: 'Access token obtenido del link de recuperación' })
  @IsString()
  @IsNotEmpty()
  access_token!: string;

  @ApiProperty({ description: 'Refresh token obtenido del link de recuperación' })
  @IsString()
  @IsNotEmpty()
  refresh_token!: string;

  @ApiProperty({ example: 'NuevaContraseña123', description: 'Nueva contraseña (mínimo 6 caracteres)' })
  @IsString()
  @MinLength(6)
  newPassword!: string;
}
