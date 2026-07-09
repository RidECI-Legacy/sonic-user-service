import { Body, Controller, Post, Request } from '@nestjs/common';
import { AuthService } from './auth.service';
import { RegisterDto } from './dto/register.dto';
import { SupabaseWebhookDto } from './dto/supabase-webhook.dto';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('register')
  register(@Body() registerDto: RegisterDto) {
    return this.authService.register(registerDto);
  }

  @Post('webhook/supabase')
  handleSupabaseWebhook(@Body() body: SupabaseWebhookDto) {
    return this.authService.handleSupabaseWebhook(body);
  }

  @Post('verify-driver')
  verifyDriver(@Request() req: { user: { id: string } }) {
    return this.authService.verifyDriver(req.user.id);
  }
}
