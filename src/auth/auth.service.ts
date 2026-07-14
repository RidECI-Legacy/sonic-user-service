import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { LicenseValidation, ProfileRole } from '@prisma/client';
import { PrismaService } from 'src/prisma/prisma.service';
import { RabbitmqService } from 'src/rabbitmq/rabbitmq.service';

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

    if (!profile)
      throw new NotFoundException(`Profile not found for userId: ${userId}`);
    if (profile.role !== ProfileRole.DRIVER)
      throw new BadRequestException(`User is not a driver`);

    const updated = await this.prisma.profiles.update({
      where: { userId },
      data: { licenseValidation: LicenseValidation.PENDING },
    });

    return { message: 'Verification requested', status: updated.licenseValidation };
  }
}
