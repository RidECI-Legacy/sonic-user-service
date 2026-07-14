import { Controller, Post, Request, UnauthorizedException } from '@nestjs/common';
import { AuthService } from './auth.service';
import type { AuthenticatedRequest } from '../common/interfaces/authenticated-request.interface';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('verify-driver')
  verifyDriver(@Request() req: AuthenticatedRequest) {
    if (!req.user) throw new UnauthorizedException();
    return this.authService.verifyDriver(req.user.id);
  }
}
