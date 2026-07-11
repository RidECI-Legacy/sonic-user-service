import { Body, Controller, Post } from '@nestjs/common';
import { ApiBody, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { CreateSupabaseDto } from './dto/create-supabase.dto';
import { SupabaseService } from './supabase.service';

@ApiTags('supabase')
@Controller('supabase')
export class SupabaseController {
  constructor(private readonly supabaseService: SupabaseService) {}

  @Post()
  @ApiOperation({ summary: 'Configurar Supabase', description: 'Crea o actualiza la configuración de Supabase del servicio.' })
  @ApiBody({ type: CreateSupabaseDto })
  @ApiResponse({ status: 201, description: 'Configuración de Supabase guardada exitosamente.' })
  @ApiResponse({ status: 400, description: 'Datos inválidos.' })
  createClient(@Body() createSupabaseDto: CreateSupabaseDto) {
    return this.supabaseService.create(createSupabaseDto);
  }
}
