import { Injectable } from '@nestjs/common';
import { CreateSupabaseDto } from './dto/create-supabase.dto';
import { createClient } from '@supabase/supabase-js';

@Injectable()
export class SupabaseService {
  create(createSupabaseDto: CreateSupabaseDto) {
    const supabase = createClient(
      createSupabaseDto.supabase_url,
      createSupabaseDto.secret_key,
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false,
        },
      },
    );

    const adminAuthClient = supabase.auth.admin;

    return adminAuthClient;
  }
}
