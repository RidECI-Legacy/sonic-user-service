import { NotFoundException } from '@nestjs/common';
import { AdminService } from './admin.service';
import { createMockPrisma, type MockPrisma } from '../test-utils/mock-prisma';
import {
  createMockSupabaseService,
  type MockSupabaseService,
} from '../test-utils/mock-supabase';

describe('AdminService', () => {
  let service: AdminService;
  let prisma: MockPrisma;
  let supabase: MockSupabaseService;
  let rabbitmq: { emitDriverVerificationResolved: jest.Mock };

  beforeEach(() => {
    prisma = createMockPrisma();
    supabase = createMockSupabaseService();
    rabbitmq = { emitDriverVerificationResolved: jest.fn() };
    service = new AdminService(
      prisma as never,
      rabbitmq as never,
      supabase as never,
    );
  });

  describe('stubs', () => {
    it('create/findAll/findOne/update/remove return placeholder strings', () => {
      expect(service.create({})).toBe('This action adds a new admin');
      expect(service.findAll()).toBe('This action returns all admin');
      expect(service.findOne(1)).toBe('This action returns a #1 admin');
      expect(service.update(1, {})).toBe('This action updates a #1 admin');
      expect(service.remove(1)).toBe('This action removes a #1 admin');
    });
  });

  it('findPendingVerifications queries pending driver profiles', async () => {
    prisma.profiles.findMany.mockResolvedValue([{ id: 'p1' }]);
    const result = await service.findPendingVerifications();
    expect(result).toEqual([{ id: 'p1' }]);
    expect(prisma.profiles.findMany).toHaveBeenCalled();
  });

  describe('verifyDriver', () => {
    it('throws NotFoundException when profile does not exist', async () => {
      prisma.profiles.findUnique.mockResolvedValue(null);
      await expect(
        service.verifyDriver('p1', { status: 'VERIFIED' } as never),
      ).rejects.toThrow(NotFoundException);
    });

    it('approves and emits an event with verifiedAt set', async () => {
      prisma.profiles.findUnique.mockResolvedValue({ id: 'p1' });
      prisma.profiles.update.mockResolvedValue({
        id: 'p1',
        userId: 'user-1',
      });

      const result = await service.verifyDriver('p1', {
        status: 'VERIFIED',
      } as never);

      expect(rabbitmq.emitDriverVerificationResolved).toHaveBeenCalledWith(
        expect.objectContaining({ profileId: 'p1', status: 'VERIFIED' }),
      );
      expect(result.message).toBe('Driver verified');
    });

    it('rejects with a rejection reason', async () => {
      prisma.profiles.findUnique.mockResolvedValue({ id: 'p1' });
      prisma.profiles.update.mockResolvedValue({
        id: 'p1',
        userId: 'user-1',
      });

      await service.verifyDriver('p1', {
        status: 'REJECTED',
        rejectionReason: 'Bad doc',
      } as never);

      expect(prisma.profiles.update).toHaveBeenCalledWith(
        expect.objectContaining({
          // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment -- expect.objectContaining() is typed `any` by Jest
          data: expect.objectContaining({
            licenseValidation: 'REJECTED',
            verifiedAt: null,
            rejectionReason: 'Bad doc',
          }),
        }),
      );
    });
  });

  it('getDashboard aggregates all metrics', async () => {
    prisma.users.count.mockResolvedValue(5);
    prisma.profiles.count.mockResolvedValue(2);
    prisma.ratings.count.mockResolvedValue(3);
    prisma.ratings.aggregate.mockResolvedValue({ _avg: { stars: 4.2 } });

    const result = await service.getDashboard();

    expect(result.totalUsers).toBe(5);
    expect(result.averageRating).toBe(4.2);
    expect(result.note).toContain('activeTrips');
  });

  it('getDashboard defaults averageRating to 0 when there are no ratings', async () => {
    prisma.users.count.mockResolvedValue(0);
    prisma.profiles.count.mockResolvedValue(0);
    prisma.ratings.count.mockResolvedValue(0);
    prisma.ratings.aggregate.mockResolvedValue({ _avg: { stars: null } });

    const result = await service.getDashboard();
    expect(result.averageRating).toBe(0);
  });

  describe('updateUserStatus', () => {
    it('throws NotFoundException when user does not exist', async () => {
      prisma.users.findUnique.mockResolvedValue(null);
      await expect(
        service.updateUserStatus('user-1', { status: 'activo' } as never),
      ).rejects.toThrow(NotFoundException);
    });

    it('maps "suspendido" to SUSPENDED', async () => {
      prisma.users.findUnique.mockResolvedValue({ id: 'user-1' });
      prisma.users.update.mockResolvedValue({
        id: 'user-1',
        name: 'Juan',
        status: 'SUSPENDED',
      });

      const result = await service.updateUserStatus('user-1', {
        status: 'suspendido',
      } as never);

      expect(prisma.users.update).toHaveBeenCalledWith({
        where: { id: 'user-1' },
        data: { status: 'SUSPENDED' },
      });
      expect(result.status).toBe('SUSPENDED');
    });
  });

  it('exportUsersReport returns a non-empty xlsx buffer', async () => {
    prisma.users.findMany.mockResolvedValue([
      {
        name: 'Juan',
        email: 'a@b.com',
        role: 'STUDENT',
        status: 'ACTIVE',
        profile: {
          phone: '+573001234567',
          documentType: 'CC',
          role: 'DRIVER',
          rate: 4.5,
          licenseValidation: 'VERIFIED',
        },
      },
      {
        name: 'Ana',
        email: 'c@d.com',
        role: null,
        status: 'ACTIVE',
        profile: null,
      },
    ]);

    const buffer = await service.exportUsersReport();
    expect(buffer).toBeInstanceOf(Buffer);
    expect(buffer.length).toBeGreaterThan(0);
  });

  describe('getPendingRoleUsers', () => {
    it('excludes users whose email domain is not ECI', async () => {
      prisma.users.findMany.mockResolvedValue([
        { id: 'u1', email: 'a@gmail.com', name: 'A' },
      ]);
      const result = await service.getPendingRoleUsers();
      expect(result).toEqual([]);
      expect(supabase.getAuthUser).not.toHaveBeenCalled();
    });

    it('excludes users whose email is not confirmed in Supabase', async () => {
      prisma.users.findMany.mockResolvedValue([
        { id: 'u1', email: 'a@escuelaing.edu.co', name: 'A' },
      ]);
      supabase.getAuthUser.mockResolvedValue({
        emailConfirmed: false,
        createdAt: '2026-01-01T00:00:00Z',
      });

      const result = await service.getPendingRoleUsers();
      expect(result).toEqual([]);
    });

    it('includes eligible users sorted by most recently registered first', async () => {
      prisma.users.findMany.mockResolvedValue([
        { id: 'u1', email: 'old@escuelaing.edu.co', name: 'Old' },
        { id: 'u2', email: 'new@mail.escuelaing.edu.co', name: 'New' },
      ]);
      supabase.getAuthUser
        .mockResolvedValueOnce({
          emailConfirmed: true,
          createdAt: '2025-01-01T00:00:00Z',
        })
        .mockResolvedValueOnce({
          emailConfirmed: true,
          createdAt: '2026-01-01T00:00:00Z',
        });

      const result = await service.getPendingRoleUsers();
      expect(result.map((r) => r.id)).toEqual(['u2', 'u1']);
    });
  });

  describe('assignUserRole', () => {
    it('throws NotFoundException when user does not exist', async () => {
      prisma.users.findUnique.mockResolvedValue(null);
      await expect(
        service.assignUserRole('user-1', { role: 'STUDENT' } as never),
      ).rejects.toThrow(NotFoundException);
    });

    it('updates the role on success', async () => {
      prisma.users.findUnique.mockResolvedValue({ id: 'user-1' });
      prisma.users.update.mockResolvedValue({
        id: 'user-1',
        name: 'Juan',
        role: 'STUDENT',
      });

      const result = await service.assignUserRole('user-1', {
        role: 'STUDENT',
      } as never);

      expect(result.role).toBe('STUDENT');
    });
  });
});
