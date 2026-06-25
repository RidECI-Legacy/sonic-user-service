import { Injectable } from '@nestjs/common';
import { createClient } from '@supabase/supabase-js';
import type { CreateSupabaseDto } from './dto/create-supabase.dto';

@Injectable()
export class SupabaseService {
	create(createSupabaseDto: CreateSupabaseDto) {
		const supabase = createClient(createSupabaseDto.supabase_url, createSupabaseDto.secret_key, {
			auth: {
				autoRefreshToken: false,
				persistSession: false,
			},
		});

		const adminAuthClient = supabase.auth.admin;

		return adminAuthClient;
	}
}
