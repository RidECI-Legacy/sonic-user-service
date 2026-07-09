import {
  Injectable,
  CanActivate,
  ExecutionContext,
  ForbiddenException,
} from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class VerifiedDriverGuard implements CanActivate {
  constructor(private readonly prisma: PrismaService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    const userId: string | undefined = request.user?.id;
    if (!userId) return false;

    const profile = await this.prisma.profiles.findUnique({
      where: { userId },
    });

    if (!profile || profile.licenseValidation !== 'VERIFIED') {
      throw new ForbiddenException('Driver is not verified');
    }

    return true;
  }
}
