import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { RabbitmqService } from '../rabbitmq/rabbitmq.service';
import { VerifyDecisionDto } from './dto/verify-decision.dto';

@Injectable()
export class AdminService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly rabbitmq: RabbitmqService,
  ) {}

  async findPendingVerifications() {
    return this.prisma.profiles.findMany({
      where: {
        role: 'DRIVER',
        licenseValidation: 'PENDING',
      },
      include: {
        user: {
          include: {
            vehicles: {
              select: { id: true, brand: true, model: true, plate: true },
            },
          },
        },
      },
    });
  }

  async verifyDriver(profileId: string, dto: VerifyDecisionDto) {
    const profile = await this.prisma.profiles.findUnique({
      where: { id: profileId },
      include: { user: true },
    });

    if (!profile) throw new NotFoundException('Profile not found');

    const updated = await this.prisma.profiles.update({
      where: { id: profileId },
      data: {
        licenseValidation: dto.status,
        verifiedAt: dto.status === 'VERIFIED' ? new Date() : null,
        rejectionReason: dto.status === 'REJECTED' ? dto.rejectionReason ?? null : null,
      },
    });

    await this.rabbitmq.emitDriverVerificationResolved({
      profileId: updated.id,
      userId: updated.userId,
      status: dto.status,
      rejectionReason: dto.rejectionReason,
    });

    return { message: `Driver ${dto.status.toLowerCase()}`, profile: updated };
  }
}
