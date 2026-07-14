import {
  BadRequestException,
  ConflictException,
  NotFoundException,
} from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { RatingsService } from './ratings.service';
import { createMockPrisma, type MockPrisma } from '../test-utils/mock-prisma';

describe('RatingsService', () => {
  let service: RatingsService;
  let prisma: MockPrisma;

  beforeEach(() => {
    prisma = createMockPrisma();
    service = new RatingsService(prisma as never);
  });

  describe('createRating', () => {
    it('throws BadRequestException when rating yourself', async () => {
      await expect(
        service.createRating('user-1', { ratedUserId: 'user-1' } as never),
      ).rejects.toThrow(BadRequestException);
    });

    it('throws NotFoundException when rated user does not exist', async () => {
      prisma.users.findUnique.mockResolvedValue(null);
      await expect(
        service.createRating('user-1', { ratedUserId: 'user-2' } as never),
      ).rejects.toThrow(NotFoundException);
    });

    it('creates the rating and updates the profile average', async () => {
      prisma.users.findUnique.mockResolvedValue({ id: 'user-2' });
      prisma.ratings.create.mockResolvedValue({ id: 'rating-1' });
      prisma.ratings.aggregate.mockResolvedValue({ _avg: { stars: 4.5 } });
      prisma.profiles.findUnique.mockResolvedValue({ userId: 'user-2' });

      const result = await service.createRating('user-1', {
        ratedUserId: 'user-2',
        tripId: 'trip-1',
        role: 'DRIVER',
        stars: 5,
      } as never);

      expect(result).toEqual({ id: 'rating-1' });
      expect(prisma.profiles.update).toHaveBeenCalledWith({
        where: { userId: 'user-2' },
        data: { rate: 4.5 },
      });
    });

    it('skips the profile average update when the rated user has no profile', async () => {
      prisma.users.findUnique.mockResolvedValue({ id: 'user-2' });
      prisma.ratings.create.mockResolvedValue({ id: 'rating-1' });
      prisma.ratings.aggregate.mockResolvedValue({ _avg: { stars: 4.5 } });
      prisma.profiles.findUnique.mockResolvedValue(null);

      await service.createRating('user-1', {
        ratedUserId: 'user-2',
        tripId: 'trip-1',
        role: 'DRIVER',
        stars: 5,
      } as never);

      expect(prisma.profiles.update).not.toHaveBeenCalled();
    });

    it('translates a P2002 duplicate rating into ConflictException', async () => {
      prisma.users.findUnique.mockResolvedValue({ id: 'user-2' });
      prisma.ratings.create.mockImplementation(() => {
        throw new Prisma.PrismaClientKnownRequestError('duplicate', {
          code: 'P2002',
          clientVersion: '7.8.0',
        });
      });

      await expect(
        service.createRating('user-1', {
          ratedUserId: 'user-2',
          tripId: 'trip-1',
          role: 'DRIVER',
          stars: 5,
        } as never),
      ).rejects.toThrow(ConflictException);
    });

    it('rethrows unrelated errors', async () => {
      prisma.users.findUnique.mockResolvedValue({ id: 'user-2' });
      prisma.ratings.create.mockImplementation(() => {
        throw new Error('unexpected');
      });

      await expect(
        service.createRating('user-1', {
          ratedUserId: 'user-2',
          tripId: 'trip-1',
          role: 'DRIVER',
          stars: 5,
        } as never),
      ).rejects.toThrow('unexpected');
    });
  });

  describe('getTripsHistory', () => {
    it('applies default pagination and returns a computed totalPages', async () => {
      prisma.ratings.findMany.mockResolvedValue([{ tripId: 't1' }]);
      prisma.ratings.count.mockResolvedValue(25);

      const result = await service.getTripsHistory('user-1', {});

      expect(result.page).toBe(1);
      expect(result.limit).toBe(10);
      expect(result.total).toBe(25);
      expect(result.totalPages).toBe(3);
    });

    it('applies custom page/limit and filters', async () => {
      prisma.ratings.findMany.mockResolvedValue([]);
      prisma.ratings.count.mockResolvedValue(0);

      const result = await service.getTripsHistory('user-1', {
        page: 2,
        limit: 5,
        role: 'DRIVER',
        fromDate: '2026-01-01',
        toDate: '2026-06-01',
      } as never);

      expect(result.page).toBe(2);
      expect(result.limit).toBe(5);
      expect(prisma.ratings.findMany).toHaveBeenCalledWith(
        expect.objectContaining({ skip: 5, take: 5 }),
      );
    });
  });
});
