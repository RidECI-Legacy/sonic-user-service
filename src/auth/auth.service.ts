import {
  Injectable,
  ConflictException,
  NotFoundException,
  BadRequestException,
  UnauthorizedException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { RabbitmqService } from '../rabbitmq/rabbitmq.service';
import { SupabaseService } from '../supabase/supabase.service';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import { RefreshDto } from './dto/refresh.dto';
import { ForgotPasswordDto } from './dto/forgot-password.dto';
import { ResetPasswordDto } from './dto/reset-password.dto';

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

  async login(dto: LoginDto) {
    let data;
    try {
      data = await this.supabase.signIn(dto.email, dto.password);
    } catch {
      throw new UnauthorizedException('Credenciales inválidas');
    }

    const user = await this.prisma.users.findUnique({
      where: { email: dto.email },
    });

    if (user) {
      await this.prisma.$executeRaw`
        UPDATE "Profiles" SET "lastSession" = NOW() WHERE "userId" = ${user.id}
      `;
    }

    return {
      access_token: data.session.access_token,
      refresh_token: data.session.refresh_token,
      expires_in: data.session.expires_in,
      token_type: data.session.token_type,
      user: {
        id: data.user.id,
        email: data.user.email,
      },
    };
  }

  async refresh(dto: RefreshDto) {
    let data;
    try {
      data = await this.supabase.refreshSession(dto.refresh_token);
    } catch {
      throw new UnauthorizedException('Refresh token inválido o expirado');
    }

    return {
      access_token: data.session.access_token,
      refresh_token: data.session.refresh_token,
      expires_in: data.session.expires_in,
      token_type: data.session.token_type,
    };
  }

  async forgotPassword(dto: ForgotPasswordDto) {
    try {
      await this.supabase.resetPasswordForEmail(
        dto.email,
        'http://localhost:3000/auth/confirmed',
      );
    } catch {
      throw new BadRequestException('No se pudo enviar el email de recuperación');
    }
    return { message: 'Email de recuperación enviado' };
  }

  async resetPassword(dto: ResetPasswordDto) {
    try {
      await this.supabase.updateUserPassword(
        dto.access_token,
        dto.refresh_token,
        dto.newPassword,
      );
    } catch {
      throw new UnauthorizedException('Token inválido o expirado');
    }
    return { message: 'Contraseña actualizada exitosamente' };
  }
}
