import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString } from 'class-validator';

export class CreateSupabaseDto {
  @ApiProperty({ example: 'https://jfypqjnoiivjzcjkzfhi.supabase.co', description: 'URL del proyecto de Supabase' })
  @IsString()
  @IsNotEmpty()
  readonly supabase_url!: string;

  @ApiProperty({ example: 'eyJhbGciOiJIUzI1NiIs...', description: 'Service role key de Supabase' })
  @IsString()
  @IsNotEmpty()
  readonly secret_key!: string;
}
