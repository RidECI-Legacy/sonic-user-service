import { Module } from '@nestjs/common';
import { UsersController } from './users.controller';
import { UsersService } from './users.service';
import { PrismaModule } from '../prisma/prisma.module';
import { SupabaseModule } from '../supabase/supabase.module';
import { RatingsModule } from '../ratings/ratings.module';

@Module({
  imports: [PrismaModule, SupabaseModule, RatingsModule],
  controllers: [UsersController],
  providers: [UsersService],
})
export class UsersModule {}
