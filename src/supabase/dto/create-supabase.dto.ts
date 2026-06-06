import { IsString, IsNotEmpty } from 'class-validator';

export class CreateSupabaseDto {
  @IsString()
  @IsNotEmpty()
  readonly supabase_url!: string;

  @IsString()
  @IsNotEmpty()
  readonly secret_key!: string;
}
