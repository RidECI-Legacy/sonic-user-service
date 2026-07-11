import { Body, Controller, Get, Post, Request } from '@nestjs/common';
import { ApiBearerAuth, ApiBody, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { AuthService } from './auth.service';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import { RefreshDto } from './dto/refresh.dto';
import { ForgotPasswordDto } from './dto/forgot-password.dto';
import { ResetPasswordDto } from './dto/reset-password.dto';

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

  @Post('login')
  @ApiOperation({ summary: 'Iniciar sesión', description: 'Autentica al usuario con email y contraseña. Retorna access_token y refresh_token de Supabase.' })
  @ApiBody({ type: LoginDto })
  @ApiResponse({ status: 200, description: 'Tokens de acceso generados exitosamente.' })
  @ApiResponse({ status: 401, description: 'Credenciales inválidas.' })
  login(@Body() loginDto: LoginDto) {
    return this.authService.login(loginDto);
  }

  @Post('refresh')
  @ApiOperation({ summary: 'Renovar token', description: 'Renueva el access_token usando un refresh_token válido.' })
  @ApiBody({ type: RefreshDto })
  @ApiResponse({ status: 200, description: 'Tokens renovados exitosamente.' })
  @ApiResponse({ status: 401, description: 'Refresh token inválido o expirado.' })
  refresh(@Body() refreshDto: RefreshDto) {
    return this.authService.refresh(refreshDto);
  }

  @Post('verify-driver')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Solicitar verificación de conductor', description: 'El usuario envía sus documentos (licencia y seguro) para ser verificado como conductor.' })
  @ApiResponse({ status: 201, description: 'Solicitud de verificación enviada exitosamente.' })
  @ApiResponse({ status: 401, description: 'No autenticado.' })
  verifyDriver(@Request() req: { user: { id: string } }) {
    return this.authService.verifyDriver(req.user.id);
  }

  @Post('forgot-password')
  @ApiOperation({ summary: 'Solicitar recuperación de contraseña', description: 'Envía un email con un enlace para restablecer la contraseña.' })
  @ApiBody({ type: ForgotPasswordDto })
  @ApiResponse({ status: 200, description: 'Email de recuperación enviado.' })
  @ApiResponse({ status: 400, description: 'Email inválido.' })
  forgotPassword(@Body() dto: ForgotPasswordDto) {
    return this.authService.forgotPassword(dto);
  }

  @Post('reset-password')
  @ApiOperation({ summary: 'Restablecer contraseña', description: 'Actualiza la contraseña usando el token de recuperación.' })
  @ApiBody({ type: ResetPasswordDto })
  @ApiResponse({ status: 200, description: 'Contraseña actualizada exitosamente.' })
  @ApiResponse({ status: 401, description: 'Token inválido o expirado.' })
  resetPassword(@Body() dto: ResetPasswordDto) {
    return this.authService.resetPassword(dto);
  }
}
