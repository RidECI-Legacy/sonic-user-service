import {
  BadRequestException,
  ConflictException,
  HttpException,
  HttpStatus,
  Injectable,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { LicenseValidation, Prisma, ProfileRole } from '@prisma/client';
import { PrismaService } from 'src/prisma/prisma.service';
import { RabbitmqService } from 'src/rabbitmq/rabbitmq.service';
import { SupabaseService } from 'src/supabase/supabase.service';
import type { SupabaseSession } from 'src/supabase/supabase.service';
import type { MulterFile } from 'src/users/interfaces/multer-file.interface';
import { extensionForMimetype } from 'src/common/upload/file-upload';
import { ForgotPasswordDto } from './dto/forgot-password.dto';
import { LoginDto } from './dto/login.dto';
import { RefreshDto } from './dto/refresh.dto';
import { RegisterDto } from './dto/register.dto';
import { ResetPasswordDto } from './dto/reset-password.dto';

const CONFIRM_REDIRECT_URL = `${process.env.APP_URL ?? 'http://localhost:3000'}/auth/confirmed`;

const UNIQUE_FIELD_MESSAGES: Record<string, string> = {
  email: 'El email ya está registrado',
  studentId: 'El ID de estudiante ya está registrado',
  phone: 'El teléfono ya está registrado',
  documentNumber: 'El número de documento ya está registrado',
};

function isSupabaseAuthError(
  error: unknown,
): error is { status: number; message: string } {
  return (
    typeof error === 'object' &&
    error !== null &&
    'status' in error &&
    'message' in error &&
    typeof (error as { status: unknown }).status === 'number'
  );
}

@Injectable()
export class AuthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly rabbitmq: RabbitmqService,
    private readonly supabase: SupabaseService,
  ) {}

  async register(dto: RegisterDto, photo?: MulterFile) {
    let supabaseUser: Awaited<ReturnType<SupabaseService['signUp']>>;
    try {
      supabaseUser = await this.supabase.signUp(
        dto.email,
        dto.password,
        {
          name: dto.name,
          documentType: dto.documentType,
          documentNumber: dto.documentNumber,
          phone: dto.phone,
          studentId: dto.studentId,
        },
        CONFIRM_REDIRECT_URL,
      );
    } catch (error) {
      if (isSupabaseAuthError(error)) {
        throw new HttpException(
          error.message,
          error.status === 429
            ? HttpStatus.TOO_MANY_REQUESTS
            : HttpStatus.BAD_REQUEST,
        );
      }
      throw error;
    }

    let photoUrl: string | undefined;
    if (photo) {
      const ext = extensionForMimetype(photo.mimetype);
      const path = `${supabaseUser.id}/photo.${ext}`;
      await this.supabase.uploadFile('profile-pics', path, photo);
      photoUrl = this.supabase.getPublicUrl('profile-pics', path);
    }

    try {
      const user = await this.prisma.$transaction(async (tx) => {
        const created = await tx.users.create({
          data: {
            id: supabaseUser.id,
            name: dto.name,
            email: dto.email,
          },
        });

        await tx.profiles.create({
          data: {
            documentType: dto.documentType,
            documentNumber: dto.documentNumber,
            phone: dto.phone,
            studentId: dto.studentId,
            userId: created.id,
            photo: photoUrl,
          },
        });

        return created;
      });

      return {
        id: user.id,
        name: user.name,
        email: user.email,
        phone: dto.phone,
        studentId: dto.studentId,
        photo: photoUrl,
      };
    } catch (error) {
      await this.supabase.deleteAuthUser(supabaseUser.id);

      if (
        error instanceof Prisma.PrismaClientKnownRequestError &&
        error.code === 'P2002'
      ) {
        const target = error.meta?.target;
        const targetStr = Array.isArray(target)
          ? target.join(',')
          : typeof target === 'string'
            ? target
            : '';
        const matchedField = Object.keys(UNIQUE_FIELD_MESSAGES).find((key) =>
          targetStr.includes(key),
        );
        throw new ConflictException(
          (matchedField && UNIQUE_FIELD_MESSAGES[matchedField]) ??
            'Datos duplicados',
        );
      }
      throw error;
    }
  }

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

    return {
      message: 'Verification requested',
      status: updated.licenseValidation,
    };
  }

  async login(dto: LoginDto) {
    let data: SupabaseSession;
    try {
      data = await this.supabase.signIn(dto.email, dto.password);
    } catch {
      throw new UnauthorizedException('Credenciales inválidas');
    }

    const user = await this.prisma.users.findUnique({
      where: { email: dto.email },
    });

    if (user) {
      await this.prisma.profiles.update({
        where: { userId: user.id },
        data: { lastSession: new Date() },
      });
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
    let data: SupabaseSession;
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
        CONFIRM_REDIRECT_URL,
      );
    } catch {
      throw new BadRequestException(
        'No se pudo enviar el email de recuperación',
      );
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
