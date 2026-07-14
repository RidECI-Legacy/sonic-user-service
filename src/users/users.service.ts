import { Injectable, NotFoundException } from '@nestjs/common';
import { LicenseValidation, ProfileRole } from '@prisma/client';
import type { Profiles } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { SupabaseService } from '../supabase/supabase.service';
import type { CreateUserDto } from './dto/create-user.dto';
import type { UpdateUserDto } from './dto/update-user.dto';
import type { UpdateProfileSelfDto } from './dto/update-profile-self.dto';
import type { MulterFile } from './interfaces/multer-file.interface';
import { ProfileUpdateBuilder } from './builders/profile-update.builder';

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
      publicUrls.driverLicense = this.supabase.getPublicUrl('driver-licenses', path);
    }

    if (files.insurance?.[0]) {
      const file = files.insurance[0];
      const ext = file.originalname.split('.').pop();
      const path = `${vehicleId}/insurance.${ext}`;
      await this.supabase.uploadFile('vehicle-insurance', path, file);
      publicUrls.insurance = this.supabase.getPublicUrl('vehicle-insurance', path);
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

  async getProfile(userId: string) {
    const user = await this.prisma.users.findUnique({
      where: { id: userId },
      include: { profile: true },
    });
    if (!user) {
      throw new NotFoundException('User not found');
    }

    return {
      id: user.id,
      name: user.name,
      email: user.email,
      phone: user.profile?.phone ?? null,
      documentType: user.profile?.documentType ?? null,
      photo: user.profile?.photo ?? null,
      rate: user.profile?.rate ?? 0,
      badges: await this.computeBadges(userId, user.profile),
    };
  }

  async updateProfile(
    userId: string,
    dto: UpdateProfileSelfDto,
    photo?: MulterFile,
  ) {
    const user = await this.prisma.users.findUnique({ where: { id: userId } });
    if (!user) {
      throw new NotFoundException('User not found');
    }

    let photoUrl: string | undefined;
    if (photo) {
      const ext = photo.originalname.split('.').pop();
      const path = `${userId}/photo.${ext}`;
      await this.supabase.uploadFile('profile-pics', path, photo);
      photoUrl = this.supabase.getPublicUrl('profile-pics', path);
    }

    if (dto.name) {
      await this.prisma.users.update({
        where: { id: userId },
        data: { name: dto.name },
      });
    }

    const profileUpdateBuilder = new ProfileUpdateBuilder()
      .withPhone(dto.phone)
      .withDocumentType(dto.documentType)
      .withPhoto(photoUrl);

    if (!profileUpdateBuilder.isEmpty()) {
      const profile = await this.prisma.profiles.findUnique({
        where: { userId },
      });
      if (!profile) {
        throw new NotFoundException('Profile not found for this user');
      }

      await this.prisma.profiles.update({
        where: { userId },
        data: profileUpdateBuilder.build(),
      });
    }

    return this.getProfile(userId);
  }

  private async computeBadges(
    userId: string,
    profile: Profiles | null,
  ): Promise<string[]> {
    if (!profile) return [];

    const badges: string[] = [];

    if (profile.licenseValidation === LicenseValidation.VERIFIED) {
      badges.push('Verified Driver');
    }

    const driverTrips = await this.prisma.ratings.groupBy({
      by: ['tripId'],
      where: { ratedUserId: userId, role: ProfileRole.DRIVER },
    });
    if (profile.rate >= 4.5 && driverTrips.length >= 20) {
      badges.push('Conductor confiable');
    }

    const passengerTrips = await this.prisma.ratings.groupBy({
      by: ['tripId'],
      where: { ratedUserId: userId, role: ProfileRole.PASSENGER },
    });
    if (passengerTrips.length >= 10) {
      badges.push('Pasajero frecuente');
    }

    return badges;
  }
}
