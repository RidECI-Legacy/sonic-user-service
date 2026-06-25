import { Controller, Post, Request } from '@nestjs/common';
import { AuthService } from './auth.service';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('verify-driver')
  verifyDriver(@Request() req: { user: { id: string } }) {
    return this.authService.verifyDriver(req.user.id);
  }
}
