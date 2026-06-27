import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { CreateAuthDto } from './dto/create-auth.dto';
import { UpdateAuthDto } from './dto/update-auth.dto';
import { PrismaService } from '../prisma/prisma.service';
import { RabbitmqService } from '../rabbitmq/rabbitmq.service';

@Injectable()
export class AuthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly rabbitmq: RabbitmqService,
  ) {}

  create(createAuthDto: CreateAuthDto) {
    return 'This action adds a new auth';
  }

  findAll() {
    return `This action returns all auth`;
  }

  findOne(id: number) {
    return `This action returns a #${id} auth`;
  }

  update(id: number, updateAuthDto: UpdateAuthDto) {
    return `This action updates a #${id} auth`;
  }

  remove(id: number) {
    return `This action removes a #${id} auth`;
  }

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
