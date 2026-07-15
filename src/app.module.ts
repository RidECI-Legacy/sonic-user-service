import { Module } from '@nestjs/common';
import { APP_GUARD } from '@nestjs/core';
import { ThrottlerGuard, ThrottlerModule } from '@nestjs/throttler';
import { AdminModule } from './admin/admin.module';
import { AuthModule } from './auth/auth.module';
import { PrismaModule } from './prisma/prisma.module';
import { SupabaseModule } from './supabase/supabase.module';
import { UsersModule } from './users/users.module';
import { VehiclesModule } from './vehicles/vehicles.module';
import { RabbitmqModule } from './rabbitmq/rabbitmq.module';
import { RatingsModule } from './ratings/ratings.module';

@Module({
  imports: [
    // Límite global de peticiones por IP: 100 req / 60 s. Los endpoints de auth
    // aplican límites más estrictos con @Throttle a nivel de handler.
    ThrottlerModule.forRoot([{ ttl: 60000, limit: 100 }]),
    UsersModule,
    AuthModule,
    AdminModule,
    SupabaseModule,
    VehiclesModule,
    PrismaModule,
    RabbitmqModule,
    RatingsModule,
  ],
  providers: [{ provide: APP_GUARD, useClass: ThrottlerGuard }],
})
export class AppModule {}
