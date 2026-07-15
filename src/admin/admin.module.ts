import { Module } from '@nestjs/common';
import { AdminController } from './admin.controller';
import { AdminService } from './admin.service';
import { PrismaModule } from '../prisma/prisma.module';
import { RabbitmqModule } from '../rabbitmq/rabbitmq.module';
import { SupabaseModule } from '../supabase/supabase.module';

@Module({
  imports: [PrismaModule, RabbitmqModule, SupabaseModule],
  controllers: [AdminController],
  providers: [AdminService],
})
export class AdminModule {}
