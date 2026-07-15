import {
  Injectable,
  CanActivate,
  ExecutionContext,
  ForbiddenException,
} from '@nestjs/common';
import { LicenseValidation } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import type { AuthenticatedRequest } from '../interfaces/authenticated-request.interface';

@Injectable()
export class VerifiedDriverGuard implements CanActivate {
  constructor(private readonly prisma: PrismaService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest<AuthenticatedRequest>();
    const userId = request.user?.id;
    if (!userId) return false;

    const profile = await this.prisma.profiles.findUnique({
      where: { userId },
    });

    if (!profile || profile.licenseValidation !== LicenseValidation.VERIFIED) {
      throw new ForbiddenException('Driver is not verified');
    }

    return true;
  }
}
