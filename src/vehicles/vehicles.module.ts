import { Module } from '@nestjs/common';
import { SupabaseModule } from '../supabase/supabase.module';
import { VehiclesController } from './vehicles.controller';
import { VehiclesService } from './vehicles.service';

@Module({
  imports: [SupabaseModule],
  controllers: [VehiclesController],
  providers: [VehiclesService],
})
export class VehiclesModule {}
