import { NotFoundException } from '@nestjs/common';
import { LicenseValidation } from '@prisma/client';
import { UsersService } from './users.service';
import { createMockPrisma, type MockPrisma } from '../test-utils/mock-prisma';
import {
  createMockSupabaseService,
  type MockSupabaseService,
} from '../test-utils/mock-supabase';

describe('UsersService', () => {
  let service: UsersService;
  let prisma: MockPrisma;
  let supabase: MockSupabaseService;

  beforeEach(() => {
    prisma = createMockPrisma();
    supabase = createMockSupabaseService();
    service = new UsersService(prisma as never, supabase as never);
  });

  describe('stubs', () => {
    it('create/findAll/findOne/update/remove return placeholder strings', () => {
      expect(service.create({} as never)).toBe('This action adds a new user');
      expect(service.findAll()).toBe('This action returns all users');
      expect(service.findOne(1)).toBe('This action returns a #1 user');
      expect(service.update(1, {})).toBe('This action updates a #1 user');
      expect(service.remove(1)).toBe('This action removes a #1 user');
    });
  });

  describe('verifyRequest', () => {
    it('throws NotFoundException when profile does not exist', async () => {
      prisma.profiles.findUnique.mockResolvedValue(null);
      await expect(
        service.verifyRequest('user-1', 'vehicle-1', {}),
      ).rejects.toThrow(NotFoundException);
    });

    it('throws NotFoundException when vehicle does not exist', async () => {
      prisma.profiles.findUnique.mockResolvedValue({ userId: 'user-1' });
      prisma.vehicles.findFirst.mockResolvedValue(null);
      await expect(
        service.verifyRequest('user-1', 'vehicle-1', {}),
      ).rejects.toThrow(NotFoundException);
    });

    it('uploads license and insurance and updates both records', async () => {
      prisma.profiles.findUnique.mockResolvedValue({ userId: 'user-1' });
      prisma.vehicles.findFirst.mockResolvedValue({ id: 'vehicle-1' });
      supabase.getPublicUrl
        .mockReturnValueOnce('https://example.com/license.png')
        .mockReturnValueOnce('https://example.com/insurance.png');

      const files = {
        license: [
          {
            buffer: Buffer.from('a'),
            originalname: 'license.png',
            mimetype: 'image/png',
          },
        ],
        insurance: [
          {
            buffer: Buffer.from('b'),
            originalname: 'insurance.png',
            mimetype: 'image/png',
          },
        ],
      };

      const result = await service.verifyRequest('user-1', 'vehicle-1', files);

      expect(supabase.uploadFile).toHaveBeenCalledTimes(2);
      expect(result.driverLicense).toBe('https://example.com/license.png');
      expect(result.insurance).toBe('https://example.com/insurance.png');
    });

    it('works when no files are provided', async () => {
      prisma.profiles.findUnique.mockResolvedValue({ userId: 'user-1' });
      prisma.vehicles.findFirst.mockResolvedValue({ id: 'vehicle-1' });

      const result = await service.verifyRequest('user-1', 'vehicle-1', {});
      expect(supabase.uploadFile).not.toHaveBeenCalled();
      expect(result.driverLicense).toBeNull();
      expect(result.insurance).toBeNull();
    });
  });

  describe('getProfile', () => {
    it('throws NotFoundException when user does not exist', async () => {
      prisma.users.findUnique.mockResolvedValue(null);
      await expect(service.getProfile('user-1')).rejects.toThrow(
        NotFoundException,
      );
    });

    it('returns defaults and no badges when there is no profile', async () => {
      prisma.users.findUnique.mockResolvedValue({
        id: 'user-1',
        name: 'Juan',
        email: 'a@b.com',
        profile: null,
      });

      const result = await service.getProfile('user-1');
      expect(result.phone).toBeNull();
      expect(result.rate).toBe(0);
      expect(result.badges).toEqual([]);
    });

    it('includes Verified Driver badge when license is verified', async () => {
      prisma.users.findUnique.mockResolvedValue({
        id: 'user-1',
        name: 'Juan',
        email: 'a@b.com',
        profile: {
          phone: '+573001234567',
          documentType: 'CC',
          photo: null,
          rate: 3,
          licenseValidation: LicenseValidation.VERIFIED,
        },
      });
      prisma.ratings.groupBy.mockResolvedValue([]);

      const result = await service.getProfile('user-1');
      expect(result.badges).toContain('Verified Driver');
    });

    it('includes Conductor confiable when rate>=4.5 and >=20 distinct driver trips', async () => {
      prisma.users.findUnique.mockResolvedValue({
        id: 'user-1',
        name: 'Juan',
        email: 'a@b.com',
        profile: {
          phone: '+573001234567',
          documentType: 'CC',
          photo: null,
          rate: 4.5,
          licenseValidation: LicenseValidation.PENDING,
        },
      });
      prisma.ratings.groupBy
        .mockResolvedValueOnce(
          Array.from({ length: 20 }, (_, i) => ({ tripId: `t${i}` })),
        )
        .mockResolvedValueOnce([]);

      const result = await service.getProfile('user-1');
      expect(result.badges).toContain('Conductor confiable');
    });

    it('includes Pasajero frecuente when >=10 distinct passenger trips', async () => {
      prisma.users.findUnique.mockResolvedValue({
        id: 'user-1',
        name: 'Juan',
        email: 'a@b.com',
        profile: {
          phone: '+573001234567',
          documentType: 'CC',
          photo: null,
          rate: 2,
          licenseValidation: LicenseValidation.PENDING,
        },
      });
      prisma.ratings.groupBy
        .mockResolvedValueOnce([])
        .mockResolvedValueOnce(
          Array.from({ length: 10 }, (_, i) => ({ tripId: `t${i}` })),
        );

      const result = await service.getProfile('user-1');
      expect(result.badges).toContain('Pasajero frecuente');
    });
  });

  describe('updateProfile', () => {
    it('throws NotFoundException when user does not exist', async () => {
      prisma.users.findUnique.mockResolvedValue(null);
      await expect(service.updateProfile('user-1', {})).rejects.toThrow(
        NotFoundException,
      );
    });

    it('updates only the name when only name is provided (no profile touch)', async () => {
      prisma.users.findUnique
        .mockResolvedValueOnce({ id: 'user-1' })
        .mockResolvedValueOnce({
          id: 'user-1',
          name: 'New Name',
          email: 'a@b.com',
          profile: null,
        });

      await service.updateProfile('user-1', { name: 'New Name' });

      expect(prisma.users.update).toHaveBeenCalledWith({
        where: { id: 'user-1' },
        data: { name: 'New Name' },
      });
      expect(prisma.profiles.update).not.toHaveBeenCalled();
    });

    it('throws NotFoundException when trying to update profile fields but no profile exists', async () => {
      prisma.users.findUnique.mockResolvedValueOnce({ id: 'user-1' });
      prisma.profiles.findUnique.mockResolvedValue(null);

      await expect(
        service.updateProfile('user-1', { phone: '+573001234567' }),
      ).rejects.toThrow(NotFoundException);
    });

    it('uploads photo and updates the profile when profile fields are provided', async () => {
      prisma.users.findUnique
        .mockResolvedValueOnce({ id: 'user-1' })
        .mockResolvedValueOnce({
          id: 'user-1',
          name: 'Juan',
          email: 'a@b.com',
          profile: {
            phone: '+573009999999',
            documentType: 'CC',
            photo: 'https://example.com/photo.png',
            rate: 0,
            licenseValidation: LicenseValidation.PENDING,
          },
        });
      prisma.profiles.findUnique.mockResolvedValue({ userId: 'user-1' });
      prisma.ratings.groupBy.mockResolvedValue([]);
      supabase.getPublicUrl.mockReturnValue('https://example.com/photo.png');

      const photo = {
        buffer: Buffer.from('x'),
        originalname: 'photo.png',
        mimetype: 'image/png',
      };

      const result = await service.updateProfile(
        'user-1',
        { phone: '+573009999999' },
        photo,
      );

      expect(supabase.uploadFile).toHaveBeenCalledWith(
        'profile-pics',
        'user-1/photo.png',
        photo,
      );
      expect(prisma.profiles.update).toHaveBeenCalled();
      expect(result.photo).toBe('https://example.com/photo.png');
    });
  });
});
