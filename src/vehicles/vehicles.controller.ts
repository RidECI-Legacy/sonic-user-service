import {
  Body,
  Controller,
  Get,
  Post,
  Request,
  UseGuards,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { SupabaseAuthGuard } from '../common/guards/supabase-auth.guard';
import type { AuthenticatedRequest } from '../common/interfaces/authenticated-request.interface';
import { CreateVehicleDto } from './dto/create-vehicle.dto';
import { VehiclesService } from './vehicles.service';

@ApiTags('vehicles')
@ApiBearerAuth()
@UseGuards(SupabaseAuthGuard)
@Controller('vehicles')
export class VehiclesController {
  constructor(private readonly vehiclesService: VehiclesService) {}

  @Post()
  @ApiOperation({
    summary: 'Registrar vehículo',
    description:
      'Registra un vehículo asociado al usuario autenticado. El dueño se toma del token, no del body.',
  })
  @ApiResponse({ status: 201, description: 'Vehículo creado exitosamente.' })
  @ApiResponse({ status: 400, description: 'Datos inválidos.' })
  @ApiResponse({ status: 401, description: 'No autenticado.' })
  @ApiResponse({ status: 409, description: 'La placa ya está registrada.' })
  create(
    @Body() createVehicleDto: CreateVehicleDto,
    @Request() req: AuthenticatedRequest,
  ) {
    return this.vehiclesService.create(req.user!.id, createVehicleDto);
  }

  @Get()
  @ApiOperation({
    summary: 'Listar vehículos propios',
    description:
      'Obtiene los vehículos registrados por el usuario autenticado.',
  })
  @ApiResponse({ status: 200, description: 'Lista de vehículos.' })
  @ApiResponse({ status: 401, description: 'No autenticado.' })
  findMyVehicles(@Request() req: AuthenticatedRequest) {
    return this.vehiclesService.findMyVehicles(req.user!.id);
  }
}
