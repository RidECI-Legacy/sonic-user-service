import {
  Injectable,
  ConflictException,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { RabbitmqService } from '../rabbitmq/rabbitmq.service';
import { SupabaseService } from '../supabase/supabase.service';
import { RegisterDto } from './dto/register.dto';
import { SupabaseWebhookDto } from './dto/supabase-webhook.dto';

@Injectable()
export class AuthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly rabbitmq: RabbitmqService,
    private readonly supabase: SupabaseService,
  ) {}

  async register(dto: RegisterDto) {
    const existing = await this.prisma.users.findUnique({
      where: { email: dto.email },
    });
    if (existing) {
      throw new ConflictException('El email ya está registrado');
    }

    const supabaseUser = await this.supabase.signUp(dto.email, dto.password, {
      name: dto.name,
      role: dto.role,
      documentType: dto.documentType,
      documentNumber: dto.documentNumber,
    });

    const user = await this.prisma.users.create({
      data: {
        id: supabaseUser.id,
        name: dto.name,
        email: dto.email,
        role: dto.role,
        verified: false,
      },
    });

    return {
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
      verified: user.verified,
    };
  }

  async handleSupabaseWebhook(body: SupabaseWebhookDto) {
    if (body.type === 'UPDATE' && body.record?.email_confirmed_at) {
      await this.markAsVerified(body.record.id);
    }
    return { received: true };
  }

  async markAsVerified(userId: string) {
    const user = await this.prisma.users.findUnique({ where: { id: userId } });
    if (!user) {
      throw new NotFoundException(`User not found: ${userId}`);
    }

    await this.prisma.users.update({
      where: { id: userId },
      data: { verified: true },
    });

    return { message: 'User verified successfully' };
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
