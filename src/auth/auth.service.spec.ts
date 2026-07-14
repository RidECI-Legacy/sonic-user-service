import {
  BadRequestException,
  ConflictException,
  HttpException,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { LicenseValidation, Prisma, ProfileRole } from '@prisma/client';
import { AuthService } from './auth.service';
import { DocumentType } from '../users/enums/document-type.enum';
import { createMockPrisma, type MockPrisma } from '../test-utils/mock-prisma';
import {
  createMockSupabaseService,
  type MockSupabaseService,
} from '../test-utils/mock-supabase';

describe('AuthService', () => {
  let service: AuthService;
  let prisma: MockPrisma;
  let supabase: MockSupabaseService;
  let rabbitmq: {
    emitDriverVerificationPending: jest.Mock;
    emitDriverVerificationResolved: jest.Mock;
  };

  beforeEach(() => {
    prisma = createMockPrisma();
    supabase = createMockSupabaseService();
    rabbitmq = {
      emitDriverVerificationPending: jest.fn(),
      emitDriverVerificationResolved: jest.fn(),
    };
    service = new AuthService(
      prisma as never,
      rabbitmq as never,
      supabase as never,
    );
  });

  describe('register', () => {
    const dto = {
      name: 'Juan Perez',
      email: 'juan@escuelaing.edu.co',
      password: 'pw12345',
      phone: '+573001234567',
      documentType: DocumentType.CC,
      documentNumber: '123',
      studentId: 'stu-1',
    };

    it('creates the user and profile on success (without photo)', async () => {
      supabase.signUp.mockResolvedValue({ id: 'sb-user-1' });
      prisma.users.create.mockResolvedValue({
        id: 'sb-user-1',
        name: dto.name,
        email: dto.email,
      });
      prisma.profiles.create.mockResolvedValue({});

      const result = await service.register(dto);

      expect(result.id).toBe('sb-user-1');
      expect(supabase.uploadFile).not.toHaveBeenCalled();
      expect(prisma.users.create).toHaveBeenCalled();
      expect(prisma.profiles.create).toHaveBeenCalled();
    });

    it('uploads the photo and includes its url when provided', async () => {
      supabase.signUp.mockResolvedValue({ id: 'sb-user-2' });
      supabase.getPublicUrl.mockReturnValue('https://example.com/photo.png');
      prisma.users.create.mockResolvedValue({
        id: 'sb-user-2',
        name: dto.name,
        email: dto.email,
      });
      prisma.profiles.create.mockResolvedValue({});

      const photo = {
        buffer: Buffer.from('x'),
        originalname: 'photo.png',
        mimetype: 'image/png',
      };

      const result = await service.register(dto, photo);

      expect(supabase.uploadFile).toHaveBeenCalledWith(
        'profile-pics',
        'sb-user-2/photo.png',
        photo,
      );
      expect(result.photo).toBe('https://example.com/photo.png');
    });

    it('translates a Supabase rate-limit error into 429', async () => {
      supabase.signUp.mockRejectedValue({
        status: 429,
        message: 'email rate limit exceeded',
      });

      await expect(service.register(dto)).rejects.toThrow(HttpException);
      try {
        await service.register(dto);
      } catch (error) {
        expect((error as HttpException).getStatus()).toBe(429);
      }
    });

    it('translates a non-rate-limit Supabase error into 400', async () => {
      supabase.signUp.mockRejectedValue({
        status: 422,
        message: 'weak password',
      });

      try {
        await service.register(dto);
        fail('should have thrown');
      } catch (error) {
        expect((error as HttpException).getStatus()).toBe(400);
      }
    });

    it('rethrows unrecognized errors from signUp as-is', async () => {
      supabase.signUp.mockRejectedValue(new Error('network down'));
      await expect(service.register(dto)).rejects.toThrow('network down');
    });

    it('translates a P2002 duplicate phone into 409 with a specific message and compensates by deleting the Supabase user', async () => {
      supabase.signUp.mockResolvedValue({ id: 'sb-user-3' });
      prisma.users.create.mockImplementation(() => {
        throw new Prisma.PrismaClientKnownRequestError('duplicate', {
          code: 'P2002',
          clientVersion: '7.8.0',
          meta: { target: ['phone'] },
        });
      });

      await expect(service.register(dto)).rejects.toThrow(ConflictException);
      expect(supabase.deleteAuthUser).toHaveBeenCalledWith('sb-user-3');
    });

    it('falls back to a generic duplicate message when the field is unrecognized', async () => {
      supabase.signUp.mockResolvedValue({ id: 'sb-user-4' });
      prisma.users.create.mockImplementation(() => {
        throw new Prisma.PrismaClientKnownRequestError('duplicate', {
          code: 'P2002',
          clientVersion: '7.8.0',
          meta: { target: ['someOtherField'] },
        });
      });

      try {
        await service.register(dto);
        fail('should have thrown');
      } catch (error) {
        expect((error as ConflictException).message).toBe('Datos duplicados');
      }
    });

    it('rethrows non-P2002 Postgres errors after compensating', async () => {
      supabase.signUp.mockResolvedValue({ id: 'sb-user-5' });
      prisma.users.create.mockImplementation(() => {
        throw new Error('unexpected db error');
      });

      await expect(service.register(dto)).rejects.toThrow(
        'unexpected db error',
      );
      expect(supabase.deleteAuthUser).toHaveBeenCalledWith('sb-user-5');
    });
  });

  describe('verifyDriver', () => {
    it('throws NotFoundException when profile does not exist', async () => {
      prisma.profiles.findUnique.mockResolvedValue(null);
      await expect(service.verifyDriver('user-1')).rejects.toThrow(
        NotFoundException,
      );
    });

    it('throws BadRequestException when user is not a driver', async () => {
      prisma.profiles.findUnique.mockResolvedValue({
        role: ProfileRole.PASSENGER,
      });
      await expect(service.verifyDriver('user-1')).rejects.toThrow(
        BadRequestException,
      );
    });

    it('sets licenseValidation to PENDING for a driver', async () => {
      prisma.profiles.findUnique.mockResolvedValue({
        role: ProfileRole.DRIVER,
      });
      prisma.profiles.update.mockResolvedValue({
        licenseValidation: LicenseValidation.PENDING,
      });

      const result = await service.verifyDriver('user-1');
      expect(result.status).toBe(LicenseValidation.PENDING);
    });
  });

  describe('login', () => {
    it('throws UnauthorizedException on invalid credentials', async () => {
      supabase.signIn.mockRejectedValue(new Error('bad creds'));
      await expect(
        service.login({ email: 'a@b.com', password: 'wrong' }),
      ).rejects.toThrow(UnauthorizedException);
    });

    it('returns tokens and updates lastSession when the local user exists', async () => {
      supabase.signIn.mockResolvedValue({
        session: {
          access_token: 'at',
          refresh_token: 'rt',
          expires_in: 3600,
          token_type: 'bearer',
        },
        user: { id: 'user-1', email: 'a@b.com' },
      });
      prisma.users.findUnique.mockResolvedValue({ id: 'user-1' });
      prisma.profiles.update.mockResolvedValue({});

      const result = await service.login({
        email: 'a@b.com',
        password: 'pw',
      });

      expect(result.access_token).toBe('at');
      expect(prisma.profiles.update).toHaveBeenCalledWith({
        where: { userId: 'user-1' },
        // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment -- expect.any() is typed `any` by Jest
        data: { lastSession: expect.any(Date) },
      });
    });

    it('returns tokens without touching profiles when no local user exists', async () => {
      supabase.signIn.mockResolvedValue({
        session: {
          access_token: 'at',
          refresh_token: 'rt',
          expires_in: 3600,
          token_type: 'bearer',
        },
        user: { id: 'user-1', email: 'a@b.com' },
      });
      prisma.users.findUnique.mockResolvedValue(null);

      await service.login({ email: 'a@b.com', password: 'pw' });
      expect(prisma.profiles.update).not.toHaveBeenCalled();
    });
  });

  describe('refresh', () => {
    it('throws UnauthorizedException on invalid refresh token', async () => {
      supabase.refreshSession.mockRejectedValue(new Error('expired'));
      await expect(service.refresh({ refresh_token: 'bad' })).rejects.toThrow(
        UnauthorizedException,
      );
    });

    it('returns renewed tokens on success', async () => {
      supabase.refreshSession.mockResolvedValue({
        session: {
          access_token: 'at2',
          refresh_token: 'rt2',
          expires_in: 3600,
          token_type: 'bearer',
        },
        user: { id: 'user-1' },
      });
      const result = await service.refresh({
        refresh_token: 'good',
      });
      expect(result.access_token).toBe('at2');
    });
  });

  describe('forgotPassword', () => {
    it('returns a confirmation message on success', async () => {
      supabase.resetPasswordForEmail.mockResolvedValue(undefined);
      const result = await service.forgotPassword({
        email: 'a@b.com',
      });
      expect(result.message).toBe('Email de recuperación enviado');
    });

    it('throws BadRequestException when Supabase fails', async () => {
      supabase.resetPasswordForEmail.mockRejectedValue(new Error('fail'));
      await expect(
        service.forgotPassword({ email: 'a@b.com' }),
      ).rejects.toThrow(BadRequestException);
    });
  });

  describe('resetPassword', () => {
    it('returns a confirmation message on success', async () => {
      supabase.updateUserPassword.mockResolvedValue(undefined);
      const result = await service.resetPassword({
        access_token: 'at',
        refresh_token: 'rt',
        newPassword: 'newpw',
      });
      expect(result.message).toBe('Contraseña actualizada exitosamente');
    });

    it('throws UnauthorizedException when Supabase fails', async () => {
      supabase.updateUserPassword.mockRejectedValue(new Error('expired'));
      await expect(
        service.resetPassword({
          access_token: 'at',
          refresh_token: 'rt',
          newPassword: 'newpw',
        }),
      ).rejects.toThrow(UnauthorizedException);
    });
  });
});
