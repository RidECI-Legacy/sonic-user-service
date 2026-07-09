import { Injectable, OnModuleInit } from '@nestjs/common';
import { createClient } from '@supabase/supabase-js';
import type { GoTrueClient } from '@supabase/auth-js';
import type { StorageClient } from '@supabase/storage-js';
import type { CreateSupabaseDto } from './dto/create-supabase.dto';

type SupabaseAdmin = ReturnType<typeof createClient>;

@Injectable()
export class SupabaseService implements OnModuleInit {
  private supabaseAdmin!: SupabaseAdmin;

  onModuleInit() {
    const url = process.env.SUPABASE_URL;
    const key = process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (url && key) {
      this.supabaseAdmin = createClient(url, key, {
        auth: { autoRefreshToken: false, persistSession: false },
      });
    }
  }

  get auth(): GoTrueClient {
    return this.supabaseAdmin.auth as unknown as GoTrueClient;
  }

  get storage(): StorageClient {
    return this.supabaseAdmin.storage as unknown as StorageClient;
  }

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

    return supabase.auth.admin;
  }

  async signUp(
    email: string,
    password: string,
    metadata?: Record<string, unknown>,
  ) {
    const { data, error } = await this.auth.admin.createUser({
      email,
      password,
      email_confirm: false,
      user_metadata: metadata,
    });
    if (error) throw error;
    return data.user;
  }

  async uploadFile(
    bucket: string,
    filePath: string,
    file: { buffer: Buffer; originalname: string; mimetype: string },
  ): Promise<string> {
    const { error } = await this.storage
      .from(bucket)
      .upload(filePath, file.buffer, {
        contentType: file.mimetype,
        upsert: true,
      });
    if (error) throw error;
    return filePath;
  }

  getPublicUrl(bucket: string, filePath: string): string {
    const { data } = this.storage.from(bucket).getPublicUrl(filePath);
    return data.publicUrl;
  }

  async getSignedUrl(
    bucket: string,
    filePath: string,
    expiresIn = 3600,
  ): Promise<string> {
    const { data, error } = await this.storage
      .from(bucket)
      .createSignedUrl(filePath, expiresIn);
    if (error) throw error;
    return data.signedUrl;
  }

  async deleteFile(bucket: string, filePath: string): Promise<void> {
    const { error } = await this.storage.from(bucket).remove([filePath]);
    if (error) throw error;
  }
}
