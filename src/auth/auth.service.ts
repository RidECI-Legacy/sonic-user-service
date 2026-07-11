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

    const existingStudentId = await this.prisma.profiles.findUnique({
      where: { studentId: dto.studentId },
    });
    if (existingStudentId) {
      throw new ConflictException('El ID de estudiante ya está registrado');
    }

    const supabaseUser = await this.supabase.signUp(
      dto.email,
      dto.password,
      {
        name: dto.name,
        documentType: dto.documentType,
        documentNumber: dto.documentNumber,
        phone: dto.phone,
        studentId: dto.studentId,
      },
      'http://localhost:3000/auth/confirmed',
    );

    const user = await this.prisma.users.create({
      data: {
        id: supabaseUser.id,
        name: dto.name,
        email: dto.email,
      },
    });

    await this.prisma.profiles.create({
      data: {
        documentType: dto.documentType,
        documentNumber: dto.documentNumber,
        phone: dto.phone,
        studentId: dto.studentId,
        userId: user.id,
      },
    });

    return {
      id: user.id,
      name: user.name,
      email: user.email,
      phone: dto.phone,
      studentId: dto.studentId,
    };
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
