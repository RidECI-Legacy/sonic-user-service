import { Body, Controller, Post, Request, UseGuards } from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { SupabaseAuthGuard } from '../common/guards/supabase-auth.guard';
import type { AuthenticatedRequest } from '../common/interfaces/authenticated-request.interface';
import { CreateRatingDto } from './dto/create-rating.dto';
import { RatingsService } from './ratings.service';

@ApiTags('ratings')
@Controller('ratings')
export class RatingsController {
  constructor(private readonly ratingsService: RatingsService) {}

  @Post()
  @UseGuards(SupabaseAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Calificar viaje',
    description:
      'Registra una calificación (1-5 estrellas) al finalizar un viaje. Un usuario solo puede calificar una vez por viaje.',
  })
  @ApiResponse({
    status: 201,
    description: 'Calificación registrada exitosamente.',
  })
  @ApiResponse({
    status: 400,
    description: 'Datos inválidos o intento de auto-calificarse.',
  })
  @ApiResponse({ status: 401, description: 'No autenticado.' })
  @ApiResponse({
    status: 404,
    description: 'Usuario calificado no encontrado.',
  })
  @ApiResponse({
    status: 409,
    description: 'Ya existe una calificación de este usuario para este viaje.',
  })
  createRating(
    @Body() dto: CreateRatingDto,
    @Request() req: AuthenticatedRequest,
  ) {
    return this.ratingsService.createRating(req.user!.id, dto);
  }
}
