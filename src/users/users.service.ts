import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { SupabaseService } from '../supabase/supabase.service';
import type { CreateUserDto } from './dto/create-user.dto';
import type { UpdateUserDto } from './dto/update-user.dto';
import type { MulterFile } from './interfaces/multer-file.interface';

@Injectable()
export class UsersService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly supabase: SupabaseService,
  ) {}

  create(createUserDto: CreateUserDto) {
    return 'This action adds a new user';
  }

  findAll() {
    return `This action returns all users`;
  }

  findOne(id: number) {
    return `This action returns a #${id} user`;
  }

  update(id: number, updateUserDto: UpdateUserDto) {
    return `This action updates a #${id} user`;
  }

  remove(id: number) {
    return `This action removes a #${id} user`;
  }

  async verifyRequest(
    userId: string,
    vehicleId: string,
    files: {
      license?: MulterFile[];
      plateImage?: MulterFile[];
      insurance?: MulterFile[];
    },
  ) {
    const profile = await this.prisma.profiles.findUnique({
      where: { userId },
    });
    if (!profile) {
      throw new NotFoundException('Profile not found');
    }

    const vehicle = await this.prisma.vehicles.findFirst({
      where: { id: vehicleId, userId },
    });
    if (!vehicle) {
      throw new NotFoundException('Vehicle not found');
    }

    const publicUrls: Record<string, string | null> = {
      driverLicense: null,
      insurance: null,
    };

    if (files.license?.[0]) {
      const file = files.license[0];
      const ext = file.originalname.split('.').pop();
      const path = `${userId}/license.${ext}`;
      await this.supabase.uploadFile('driver-licenses', path, file);
      publicUrls.driverLicense = this.supabase.getPublicUrl(
        'driver-licenses',
        path,
      );
    }

    if (files.insurance?.[0]) {
      const file = files.insurance[0];
      const ext = file.originalname.split('.').pop();
      const path = `${vehicleId}/insurance.${ext}`;
      await this.supabase.uploadFile('vehicle-insurance', path, file);
      publicUrls.insurance = this.supabase.getPublicUrl(
        'vehicle-insurance',
        path,
      );
    }

    await this.prisma.profiles.update({
      where: { userId },
      data: { driverLicense: publicUrls.driverLicense },
    });

    await this.prisma.vehicles.update({
      where: { id: vehicleId },
      data: {
        insurance: publicUrls.insurance,
      },
    });

    return {
      message: 'Documents uploaded successfully',
      driverLicense: publicUrls.driverLicense,
      insurance: publicUrls.insurance,
    };
  }
}
