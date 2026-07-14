import { Module } from '@nestjs/common';
import { AdminModule } from './admin/admin.module';
import { AuthModule } from './auth/auth.module';
import { PrismaModule } from './prisma/prisma.module';
import { ProfileModule } from './profile/profile.module';
import { SupabaseModule } from './supabase/supabase.module';
import { UsersModule } from './users/users.module';
import { VehiclesModule } from './vehicles/vehicles.module';
import { RabbitmqModule } from './rabbitmq/rabbitmq.module';
import { RatingsModule } from './ratings/ratings.module';

@Module({
  imports: [
    UsersModule,
    AuthModule,
    ProfileModule,
    AdminModule,
    SupabaseModule,
    VehiclesModule,
    PrismaModule,
    RabbitmqModule,
    RatingsModule,
  ],
})
export class AppModule {}
