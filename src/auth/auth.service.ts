import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { RabbitmqService } from '../rabbitmq/rabbitmq.service';

@Injectable()
export class AuthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly rabbitmq: RabbitmqService,
  ) {}

  async verifyDriver(userId: string) {
    const profile = await this.prisma.profiles.findUnique({
      where: { userId },
    });

    if (!profile) {
      throw new NotFoundException(`Profile not found for userId: ${userId}`);
    }
    if (profile.role !== 'DRIVER') {
      throw new BadRequestException('User is not a driver');
    }

    const updated = await this.prisma.profiles.update({
      where: { userId },
      data: { licenseValidation: 'PENDING' },
      include: { user: true },
    });

    await this.rabbitmq.emitDriverVerificationPending({
      profileId: updated.id,
      userId,
      name: updated.user.name,
      email: updated.user.email,
    });

    return { message: 'Verification requested', status: 'PENDING' };
  }
}
