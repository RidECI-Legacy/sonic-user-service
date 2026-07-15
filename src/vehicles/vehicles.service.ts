import { ConflictException, Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import type { CreateVehicleDto } from './dto/create-vehicle.dto';

@Injectable()
export class VehiclesService {
  constructor(private readonly prisma: PrismaService) {}

  async create(userId: string, dto: CreateVehicleDto) {
    try {
      return await this.prisma.vehicles.create({
        data: {
          brand: dto.brand,
          model: dto.model,
          plate: dto.plate,
          type: dto.type,
          userId,
        },
      });
    } catch (error) {
      if (
        error instanceof Prisma.PrismaClientKnownRequestError &&
        error.code === 'P2002'
      ) {
        throw new ConflictException('La placa ya está registrada');
      }
      throw error;
    }
  }

  findMyVehicles(userId: string) {
    return this.prisma.vehicles.findMany({ where: { userId } });
  }
}
