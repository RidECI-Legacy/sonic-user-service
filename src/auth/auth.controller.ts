import { Controller, Get, Post, Request } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { AuthService } from './auth.service';
import { RegisterDto } from './dto/register.dto';

@ApiTags('auth')
@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('register')
  @ApiOperation({ summary: 'Registrar usuario', description: 'Registra un nuevo usuario con email institucional ECI. Crea la cuenta en Supabase y el registro en Users y Profiles. El email de verificación es enviado por Supabase.' })
  @ApiResponse({ status: 201, description: 'Usuario y perfil creados exitosamente. Email de verificación enviado.' })
  @ApiResponse({ status: 400, description: 'Email no pertenece al dominio ECI o datos inválidos.' })
  @ApiResponse({ status: 409, description: 'El email o el ID de estudiante ya está registrado.' })
  register(@Request() req: { body: RegisterDto }) {
    return this.authService.register(req.body);
  }

  @Get('confirmed')
  @ApiOperation({ summary: 'Email verificado', description: 'Página de redirección después de que el usuario verifica su email desde el enlace recibido.' })
  @ApiResponse({ status: 200, description: 'Email verificado exitosamente.' })
  confirmed() {
    return { message: 'Email verificado exitosamente. Ya puedes iniciar sesión.' };
  }

  @Post('verify-driver')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Solicitar verificación de conductor', description: 'El usuario envía sus documentos (licencia y seguro) para ser verificado como conductor.' })
  @ApiResponse({ status: 201, description: 'Solicitud de verificación enviada exitosamente.' })
  @ApiResponse({ status: 401, description: 'No autenticado.' })
  verifyDriver(@Request() req: { user: { id: string } }) {
    return this.authService.verifyDriver(req.user.id);
  }
}
