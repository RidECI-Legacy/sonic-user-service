import { Body, Controller, Post } from '@nestjs/common';
import type { CreateSupabaseDto } from './dto/create-supabase.dto';
import { SupabaseService } from './supabase.service';

@Controller('supabase')
export class SupabaseController {
  constructor(private readonly supabaseService: SupabaseService) {}

  @Post()
  createClient(@Body() createSupabaseDto: CreateSupabaseDto) {
    return this.supabaseService.create(createSupabaseDto);
  }
}
