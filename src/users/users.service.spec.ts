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
      supabase.uploadFile
        .mockResolvedValueOnce('user-1/license.png')
        .mockResolvedValueOnce('vehicle-1/insurance.png');
      supabase.getSignedUrl
        .mockResolvedValueOnce('https://example.com/signed-license')
        .mockResolvedValueOnce('https://example.com/signed-insurance');

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
      expect(supabase.getPublicUrl).not.toHaveBeenCalled();
      expect(prisma.profiles.update).toHaveBeenCalledWith({
        where: { userId: 'user-1' },
        data: { driverLicense: 'user-1/license.png' },
      });
      expect(prisma.vehicles.update).toHaveBeenCalledWith({
        where: { id: 'vehicle-1' },
        data: { insurance: 'vehicle-1/insurance.png' },
      });
      expect(result.driverLicense).toBe('https://example.com/signed-license');
      expect(result.insurance).toBe('https://example.com/signed-insurance');
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
      await expect(service.getProfile('user-1', 'user-1')).rejects.toThrow(
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

      const result = await service.getProfile('user-1', 'user-1');
      expect(result.phone).toBeNull();
      expect(result.rate).toBe(0);
      expect(result.badges).toEqual([]);
    });

    it('exposes PII (email/phone/documentType) only to the profile owner', async () => {
      prisma.users.findUnique.mockResolvedValue({
        id: 'user-1',
        name: 'Juan',
        email: 'a@b.com',
        profile: {
          phone: '+573001234567',
          documentType: 'CC',
          photo: 'p.png',
          rate: 4,
          licenseValidation: LicenseValidation.PENDING,
        },
      });
      prisma.ratings.groupBy.mockResolvedValue([]);

      const owner = await service.getProfile('user-1', 'user-1');
      expect(owner).toMatchObject({
        email: 'a@b.com',
        phone: '+573001234567',
        documentType: 'CC',
      });
    });

    it('hides PII from non-owners but keeps public fields', async () => {
      prisma.users.findUnique.mockResolvedValue({
        id: 'user-1',
        name: 'Juan',
        email: 'a@b.com',
        profile: {
          phone: '+573001234567',
          documentType: 'CC',
          photo: 'p.png',
          rate: 4,
          licenseValidation: LicenseValidation.PENDING,
        },
      });
      prisma.ratings.groupBy.mockResolvedValue([]);

      const result = await service.getProfile('user-1', 'someone-else');
      expect(result).not.toHaveProperty('email');
      expect(result).not.toHaveProperty('phone');
      expect(result).not.toHaveProperty('documentType');
      expect(result.name).toBe('Juan');
      expect(result.photo).toBe('p.png');
      expect(result.rate).toBe(4);
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

      const result = await service.getProfile('user-1', 'user-1');
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

      const result = await service.getProfile('user-1', 'user-1');
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

      const result = await service.getProfile('user-1', 'user-1');
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
