import { Controller, Post, Body } from '@nestjs/common';
import { SupabaseService } from './supabase.service';
import { CreateSupabaseDto } from './dto/create-supabase.dto';

@Controller('supabase')
export class SupabaseController {
  constructor(private readonly supabaseService: SupabaseService) {}

  @Post()
  createClient(@Body() createSupabaseDto: CreateSupabaseDto) {
    return this.supabaseService.create(createSupabaseDto);
  }
}
