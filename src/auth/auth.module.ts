import { Module } from '@nestjs/common';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { PrismaModule } from '../prisma/prisma.module';
import { RabbitmqModule } from '../rabbitmq/rabbitmq.module';
import { SupabaseModule } from '../supabase/supabase.module';

@Module({
  imports: [PrismaModule, RabbitmqModule, SupabaseModule],
  controllers: [AuthController],
  providers: [AuthService],
})
export class AuthModule {}
