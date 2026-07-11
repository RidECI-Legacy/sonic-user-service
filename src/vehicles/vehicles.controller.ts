import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
} from '@nestjs/common';
import { ApiOperation, ApiParam, ApiResponse, ApiTags } from '@nestjs/swagger';
import { CreateVehicleDto } from './dto/create-vehicle.dto';
import { UpdateVehicleDto } from './dto/update-vehicle.dto';
import { VehiclesService } from './vehicles.service';

@ApiTags('vehicles')
@Controller('vehicles')
export class VehiclesController {
  constructor(private readonly vehiclesService: VehiclesService) {}

  @Post()
  @ApiOperation({ summary: 'Crear vehículo', description: 'Registra un nuevo vehículo en el sistema.' })
  @ApiResponse({ status: 201, description: 'Vehículo creado exitosamente.' })
  @ApiResponse({ status: 400, description: 'Datos inválidos.' })
  create(@Body() createVehicleDto: CreateVehicleDto) {
    return this.vehiclesService.create(createVehicleDto);
  }

  @Get()
  @ApiOperation({ summary: 'Listar vehículos', description: 'Obtiene todos los vehículos registrados.' })
  @ApiResponse({ status: 200, description: 'Lista de vehículos.' })
  findAll() {
    return this.vehiclesService.findAll();
  }

  @Get(':id')
  @ApiOperation({ summary: 'Obtener vehículo por ID', description: 'Obtiene un vehículo específico por su ID.' })
  @ApiParam({ name: 'id', description: 'ID del vehículo', example: 'uuid-1234-5678' })
  @ApiResponse({ status: 200, description: 'Vehículo encontrado.' })
  @ApiResponse({ status: 404, description: 'Vehículo no encontrado.' })
  findOne(@Param('id') id: string) {
    return this.vehiclesService.findOne(+id);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Actualizar vehículo', description: 'Actualiza parcialmente los datos de un vehículo.' })
  @ApiParam({ name: 'id', description: 'ID del vehículo', example: 'uuid-1234-5678' })
  @ApiResponse({ status: 200, description: 'Vehículo actualizado exitosamente.' })
  @ApiResponse({ status: 404, description: 'Vehículo no encontrado.' })
  update(@Param('id') id: string, @Body() updateVehicleDto: UpdateVehicleDto) {
    return this.vehiclesService.update(+id, updateVehicleDto);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Eliminar vehículo', description: 'Elimina un vehículo de la base de datos.' })
  @ApiParam({ name: 'id', description: 'ID del vehículo', example: 'uuid-1234-5678' })
  @ApiResponse({ status: 200, description: 'Vehículo eliminado exitosamente.' })
  @ApiResponse({ status: 404, description: 'Vehículo no encontrado.' })
  remove(@Param('id') id: string) {
    return this.vehiclesService.remove(+id);
  }
}
