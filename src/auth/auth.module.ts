import { Module } from '@nestjs/common';
import { AuthService } from './auth.service';
import { AuthController } from './auth.controller';
import { PrismaModule } from 'src/prisma/prisma.module';
import { RabbitmqModule } from 'src/rabbitmq/rabbitmq.module';
import { SupabaseModule } from 'src/supabase/supabase.module';

@Module({
  imports: [PrismaModule, RabbitmqModule, SupabaseModule],
  controllers: [AuthController],
  providers: [AuthService],
})
export class AuthModule {}
