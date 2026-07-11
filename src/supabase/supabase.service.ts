import { Injectable, OnModuleInit } from '@nestjs/common';
import { createClient } from '@supabase/supabase-js';
import type { GoTrueClient } from '@supabase/auth-js';
import type { StorageClient } from '@supabase/storage-js';
import type { CreateSupabaseDto } from './dto/create-supabase.dto';

type SupabaseAdmin = ReturnType<typeof createClient>;

@Injectable()
export class SupabaseService implements OnModuleInit {
  private supabaseAdmin!: SupabaseAdmin;
  private supabaseAnon!: SupabaseAdmin;

  onModuleInit() {
    const url = process.env.SUPABASE_URL;
    const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
    const anonKey = process.env.SECRET_KEY;

    if (url && serviceKey) {
      this.supabaseAdmin = createClient(url, serviceKey, {
        auth: { autoRefreshToken: false, persistSession: false },
      });
    }

    if (url && anonKey) {
      this.supabaseAnon = createClient(url, anonKey, {
        auth: { autoRefreshToken: false, persistSession: false },
      });
    }
  }

  get auth(): GoTrueClient {
    return this.supabaseAdmin.auth as unknown as GoTrueClient;
  }

  get anonAuth(): GoTrueClient {
    return this.supabaseAnon.auth as unknown as GoTrueClient;
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
    redirectTo?: string,
  ) {
    const { data, error } = await this.anonAuth.signUp({
      email,
      password,
      options: {
        data: metadata,
        emailRedirectTo: redirectTo,
      },
    });
    if (error) throw error;
    if (!data.user) throw new Error('No user returned from Supabase signUp');
    return data.user;
  }

  async signIn(email: string, password: string) {
    const { data, error } = await this.anonAuth.signInWithPassword({
      email,
      password,
    });
    if (error) throw error;
    return data;
  }

  async refreshSession(refreshToken: string) {
    const { data, error } = await this.anonAuth.refreshSession({
      refresh_token: refreshToken,
    });
    if (error) throw error;
    return data;
  }

  async resetPasswordForEmail(email: string, redirectTo?: string) {
    const { error } = await this.anonAuth.resetPasswordForEmail(email, {
      redirectTo,
    });
    if (error) throw error;
  }

  async updateUserPassword(accessToken: string, refreshToken: string, newPassword: string) {
    const url = process.env.SUPABASE_URL;
    const anonKey = process.env.SECRET_KEY;

    const userSupabase = createClient(url!, anonKey!, {
      auth: { autoRefreshToken: false, persistSession: false },
    });

    const { error: sessionError } = await userSupabase.auth.setSession({
      access_token: accessToken,
      refresh_token: refreshToken,
    });
    if (sessionError) throw sessionError;

    const { error } = await userSupabase.auth.updateUser({
      password: newPassword,
    });
    if (error) throw error;
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
