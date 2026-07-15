import { Injectable, NotFoundException } from '@nestjs/common';
import { LicenseValidation, ProfileRole } from '@prisma/client';
import type { Profiles } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { SupabaseService } from '../supabase/supabase.service';
import type { UpdateProfileSelfDto } from './dto/update-profile-self.dto';
import type { MulterFile } from './interfaces/multer-file.interface';
import { ProfileUpdateBuilder } from './builders/profile-update.builder';
import { extensionForMimetype } from '../common/upload/file-upload';

@Injectable()
export class UsersService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly supabase: SupabaseService,
  ) {}

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

    // Estos buckets son privados: guardamos el path en BD y servimos signed URLs
    // bajo demanda. Nunca URLs públicas (los documentos son datos personales).
    const storedPaths: Record<'driverLicense' | 'insurance', string | null> = {
      driverLicense: null,
      insurance: null,
    };

    if (files.license?.[0]) {
      const file = files.license[0];
      const ext = extensionForMimetype(file.mimetype);
      const path = `${userId}/license.${ext}`;
      storedPaths.driverLicense = await this.supabase.uploadFile(
        'driver-licenses',
        path,
        file,
      );
    }

    if (files.insurance?.[0]) {
      const file = files.insurance[0];
      const ext = extensionForMimetype(file.mimetype);
      const path = `${vehicleId}/insurance.${ext}`;
      storedPaths.insurance = await this.supabase.uploadFile(
        'vehicle-insurance',
        path,
        file,
      );
    }

    await this.prisma.profiles.update({
      where: { userId },
      data: { driverLicense: storedPaths.driverLicense },
    });

    await this.prisma.vehicles.update({
      where: { id: vehicleId },
      data: {
        insurance: storedPaths.insurance,
      },
    });

    return {
      message: 'Documents uploaded successfully',
      driverLicense: storedPaths.driverLicense
        ? await this.supabase.getSignedUrl(
            'driver-licenses',
            storedPaths.driverLicense,
          )
        : null,
      insurance: storedPaths.insurance
        ? await this.supabase.getSignedUrl(
            'vehicle-insurance',
            storedPaths.insurance,
          )
        : null,
    };
  }

  async getProfile(userId: string, requesterId: string) {
    const user = await this.prisma.users.findUnique({
      where: { id: userId },
      include: { profile: true },
    });
    if (!user) {
      throw new NotFoundException('User not found');
    }

    // Datos públicos: cualquier usuario autenticado puede verlos (p. ej. un
    // pasajero viendo la reputación de un conductor).
    const publicProfile = {
      id: user.id,
      name: user.name,
      photo: user.profile?.photo ?? null,
      rate: user.profile?.rate ?? 0,
      badges: await this.computeBadges(userId, user.profile),
    };

    // El email, teléfono y documento son PII: solo el dueño del perfil los recibe.
    if (requesterId !== userId) {
      return publicProfile;
    }

    return {
      ...publicProfile,
      email: user.email,
      phone: user.profile?.phone ?? null,
      documentType: user.profile?.documentType ?? null,
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
      const ext = extensionForMimetype(photo.mimetype);
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

    return this.getProfile(userId, userId);
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
