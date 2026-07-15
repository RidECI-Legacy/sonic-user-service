import { Injectable, NotFoundException } from '@nestjs/common';
import { LicenseValidation, ProfileRole, UserStatus } from '@prisma/client';
import { Workbook } from 'exceljs';
import { PrismaService } from '../prisma/prisma.service';
import { RabbitmqService } from '../rabbitmq/rabbitmq.service';
import { SupabaseService } from '../supabase/supabase.service';
import type { AssignRoleDto } from './dto/assign-role.dto';
import type { UpdateUserStatusDto } from './dto/update-user-status.dto';
import type { VerifyDecisionDto } from './dto/verify-decision.dto';

const USER_STATUS_MAP: Record<'activo' | 'suspendido', UserStatus> = {
  activo: UserStatus.ACTIVE,
  suspendido: UserStatus.SUSPENDED,
};

const ECI_DOMAIN_REGEX = /^[a-zA-Z0-9._%+-]+@(mail\.)?escuelaing\.edu\.co$/;

@Injectable()
export class AdminService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly rabbitmq: RabbitmqService,
    private readonly supabase: SupabaseService,
  ) {}

  async findPendingVerifications() {
    const profiles = await this.prisma.profiles.findMany({
      where: {
        role: 'DRIVER',
        licenseValidation: 'PENDING',
      },
      include: {
        user: {
          include: {
            vehicles: {
              select: {
                id: true,
                brand: true,
                model: true,
                plate: true,
                insurance: true,
              },
            },
          },
        },
      },
    });

    // Los documentos viven en buckets privados: convertimos los paths guardados
    // en signed URLs temporales para que el admin pueda revisarlos.
    return Promise.all(
      profiles.map(async (profile) => ({
        ...profile,
        driverLicense: profile.driverLicense
          ? await this.supabase.getSignedUrl(
              'driver-licenses',
              profile.driverLicense,
            )
          : null,
        user: {
          ...profile.user,
          vehicles: await Promise.all(
            profile.user.vehicles.map(async (vehicle) => ({
              ...vehicle,
              insurance: vehicle.insurance
                ? await this.supabase.getSignedUrl(
                    'vehicle-insurance',
                    vehicle.insurance,
                  )
                : null,
            })),
          ),
        },
      })),
    );
  }

  async verifyDriver(profileId: string, dto: VerifyDecisionDto) {
    const profile = await this.prisma.profiles.findUnique({
      where: { id: profileId },
      include: { user: true },
    });

    if (!profile) throw new NotFoundException('Profile not found');

    const updated = await this.prisma.profiles.update({
      where: { id: profileId },
      data: {
        licenseValidation: dto.status,
        verifiedAt: dto.status === 'VERIFIED' ? new Date() : null,
        rejectionReason:
          dto.status === 'REJECTED' ? (dto.rejectionReason ?? null) : null,
      },
    });

    await this.rabbitmq.emitDriverVerificationResolved({
      profileId: updated.id,
      userId: updated.userId,
      status: dto.status,
      rejectionReason: dto.rejectionReason,
    });

    return { message: `Driver ${dto.status.toLowerCase()}`, profile: updated };
  }

  async getDashboard() {
    const [
      totalUsers,
      totalDrivers,
      totalPassengers,
      pendingVerifications,
      verifiedDrivers,
      suspendedUsers,
      totalRatings,
      ratingsAvg,
    ] = await Promise.all([
      this.prisma.users.count(),
      this.prisma.profiles.count({ where: { role: ProfileRole.DRIVER } }),
      this.prisma.profiles.count({ where: { role: ProfileRole.PASSENGER } }),
      this.prisma.profiles.count({
        where: {
          role: ProfileRole.DRIVER,
          licenseValidation: LicenseValidation.PENDING,
        },
      }),
      this.prisma.profiles.count({
        where: { licenseValidation: LicenseValidation.VERIFIED },
      }),
      this.prisma.users.count({ where: { status: UserStatus.SUSPENDED } }),
      this.prisma.ratings.count(),
      this.prisma.ratings.aggregate({ _avg: { stars: true } }),
    ]);

    return {
      totalUsers,
      totalDrivers,
      totalPassengers,
      pendingVerifications,
      verifiedDrivers,
      suspendedUsers,
      totalRatings,
      averageRating: ratingsAvg._avg.stars ?? 0,
      note: 'activeTrips y pendingEmergencyAlerts no incluidos: pendiente de integración con el microservicio de viajes.',
    };
  }

  async updateUserStatus(userId: string, dto: UpdateUserStatusDto) {
    const user = await this.prisma.users.findUnique({ where: { id: userId } });
    if (!user) throw new NotFoundException('User not found');

    const updated = await this.prisma.users.update({
      where: { id: userId },
      data: { status: USER_STATUS_MAP[dto.status] },
    });

    return { id: updated.id, name: updated.name, status: updated.status };
  }

  async exportUsersReport(): Promise<Buffer> {
    const users = await this.prisma.users.findMany({
      include: { profile: true },
      orderBy: { name: 'asc' },
    });

    const workbook = new Workbook();
    const sheet = workbook.addWorksheet('Usuarios');
    sheet.columns = [
      { header: 'Nombre', key: 'name', width: 25 },
      { header: 'Email', key: 'email', width: 30 },
      { header: 'Rol', key: 'role', width: 15 },
      { header: 'Estado', key: 'status', width: 12 },
      { header: 'Teléfono', key: 'phone', width: 18 },
      { header: 'Tipo doc.', key: 'documentType', width: 12 },
      { header: 'Rol de perfil', key: 'profileRole', width: 15 },
      { header: 'Reputación', key: 'rate', width: 12 },
      { header: 'Licencia', key: 'licenseValidation', width: 15 },
    ];

    for (const user of users) {
      sheet.addRow({
        name: user.name,
        email: user.email,
        role: user.role ?? '',
        status: user.status,
        phone: user.profile?.phone ?? '',
        documentType: user.profile?.documentType ?? '',
        profileRole: user.profile?.role ?? '',
        rate: user.profile?.rate ?? 0,
        licenseValidation: user.profile?.licenseValidation ?? '',
      });
    }

    const buffer = await workbook.xlsx.writeBuffer();
    return Buffer.from(buffer);
  }

  async getPendingRoleUsers() {
    const users = await this.prisma.users.findMany({ where: { role: null } });
    const domainValid = users.filter((user) =>
      ECI_DOMAIN_REGEX.test(user.email),
    );

    const withAuthData = await Promise.all(
      domainValid.map(async (user) => ({
        user,
        auth: await this.supabase.getAuthUser(user.id),
      })),
    );

    return withAuthData
      .filter(({ auth }) => auth?.emailConfirmed)
      .sort(
        (a, b) =>
          new Date(b.auth!.createdAt).getTime() -
          new Date(a.auth!.createdAt).getTime(),
      )
      .map(({ user, auth }) => ({
        id: user.id,
        name: user.name,
        email: user.email,
        registeredAt: auth!.createdAt,
      }));
  }

  async assignUserRole(userId: string, dto: AssignRoleDto) {
    const user = await this.prisma.users.findUnique({ where: { id: userId } });
    if (!user) throw new NotFoundException('User not found');

    const updated = await this.prisma.users.update({
      where: { id: userId },
      data: { role: dto.role },
    });

    return { id: updated.id, name: updated.name, role: updated.role };
  }
}
