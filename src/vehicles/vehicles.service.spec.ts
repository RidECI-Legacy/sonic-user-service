import { ConflictException } from '@nestjs/common';
import { Prisma, VehicleType } from '@prisma/client';
import { createMockPrisma, type MockPrisma } from '../test-utils/mock-prisma';
import { VehiclesService } from './vehicles.service';

describe('VehiclesService', () => {
  let prisma: MockPrisma;
  let service: VehiclesService;

  const dto = {
    brand: 'Toyota',
    model: 'Corolla',
    plate: 'ABC-123',
    type: VehicleType.CAR,
  };

  beforeEach(() => {
    prisma = createMockPrisma();
    service = new VehiclesService(prisma as never);
  });

  describe('create', () => {
    it('creates a vehicle owned by the authenticated user', async () => {
      const created = {
        id: 'veh-1',
        ...dto,
        userId: 'user-1',
        insurance: null,
      };
      prisma.vehicles.create.mockResolvedValue(created);

      const result = await service.create('user-1', dto);

      expect(prisma.vehicles.create).toHaveBeenCalledWith({
        data: {
          brand: dto.brand,
          model: dto.model,
          plate: dto.plate,
          type: dto.type,
          userId: 'user-1',
        },
      });
      expect(result).toBe(created);
    });

    it('throws ConflictException when the plate is already taken (P2002)', async () => {
      prisma.vehicles.create.mockRejectedValue(
        new Prisma.PrismaClientKnownRequestError('Unique constraint', {
          code: 'P2002',
          clientVersion: 'test',
        }),
      );

      await expect(service.create('user-1', dto)).rejects.toBeInstanceOf(
        ConflictException,
      );
    });

    it('rethrows unexpected errors', async () => {
      const boom = new Error('db down');
      prisma.vehicles.create.mockRejectedValue(boom);

      await expect(service.create('user-1', dto)).rejects.toBe(boom);
    });
  });

  describe('findMyVehicles', () => {
    it('returns only the vehicles of the given user', async () => {
      const vehicles = [{ id: 'veh-1', userId: 'user-1' }];
      prisma.vehicles.findMany.mockResolvedValue(vehicles);

      const result = await service.findMyVehicles('user-1');

      expect(prisma.vehicles.findMany).toHaveBeenCalledWith({
        where: { userId: 'user-1' },
      });
      expect(result).toBe(vehicles);
    });
  });
});
