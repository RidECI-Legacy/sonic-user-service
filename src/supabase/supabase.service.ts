import { Injectable } from '@nestjs/common';
import { createClient } from '@supabase/supabase-js';
import type { CreateSupabaseDto } from './dto/create-supabase.dto';

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

  async uploadFile(
    bucket: string,
    filePath: string,
    file: { buffer: Buffer; originalname: string; mimetype: string },
  ): Promise<string> {
    const { error } = await this.supabase.storage
      .from(bucket)
      .upload(filePath, file.buffer, {
        contentType: file.mimetype,
        upsert: true,
      });
    if (error) throw error;
    return filePath;
  }

  getPublicUrl(bucket: string, filePath: string): string {
    const { data } = this.supabase.storage.from(bucket).getPublicUrl(filePath);
    return data.publicUrl;
  }

  async getSignedUrl(
    bucket: string,
    filePath: string,
    expiresIn = 3600,
  ): Promise<string> {
    const { data, error } = await this.supabase.storage
      .from(bucket)
      .createSignedUrl(filePath, expiresIn);
    if (error) throw error;
    return data.signedUrl;
  }

  async deleteFile(bucket: string, filePath: string): Promise<void> {
    const { error } = await this.supabase.storage
      .from(bucket)
      .remove([filePath]);
    if (error) throw error;
  }
}
