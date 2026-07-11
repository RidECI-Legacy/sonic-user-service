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
import { AdminService } from './admin.service';
import { CreateAdminDto } from './dto/create-admin.dto';
import { UpdateAdminDto } from './dto/update-admin.dto';
import { VerifyDecisionDto } from './dto/verify-decision.dto';

@ApiTags('admin')
@Controller('admin')
export class AdminController {
  constructor(private readonly adminService: AdminService) {}

  @Post()
  @ApiOperation({ summary: 'Crear administrador', description: 'Crea un nuevo registro de administrador.' })
  @ApiResponse({ status: 201, description: 'Administrador creado exitosamente.' })
  create(@Body() createAdminDto: CreateAdminDto) {
    return this.adminService.create(createAdminDto);
  }

  @Get()
  @ApiOperation({ summary: 'Listar administradores', description: 'Obtiene todos los administradores registrados.' })
  @ApiResponse({ status: 200, description: 'Lista de administradores.' })
  findAll() {
    return this.adminService.findAll();
  }

  @Get(':id')
  @ApiOperation({ summary: 'Obtener administrador por ID', description: 'Obtiene un administrador específico por su ID.' })
  @ApiParam({ name: 'id', description: 'ID del administrador', example: '1' })
  @ApiResponse({ status: 200, description: 'Administrador encontrado.' })
  @ApiResponse({ status: 404, description: 'Administrador no encontrado.' })
  findOne(@Param('id') id: string) {
    return this.adminService.findOne(+id);
  }

  @Get('verifications/pending')
  @ApiOperation({ summary: 'Verificaciones pendientes', description: 'Obtiene la lista de conductores pendientes de verificación.' })
  @ApiResponse({ status: 200, description: 'Lista de verificaciones pendientes.' })
  findPendingVerifications() {
    return this.adminService.findPendingVerifications();
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Actualizar administrador', description: 'Actualiza parcialmente los datos de un administrador.' })
  @ApiParam({ name: 'id', description: 'ID del administrador', example: '1' })
  @ApiResponse({ status: 200, description: 'Administrador actualizado exitosamente.' })
  @ApiResponse({ status: 404, description: 'Administrador no encontrado.' })
  update(@Param('id') id: string, @Body() updateAdminDto: UpdateAdminDto) {
    return this.adminService.update(+id, updateAdminDto);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Eliminar administrador', description: 'Elimina un administrador de la base de datos.' })
  @ApiParam({ name: 'id', description: 'ID del administrador', example: '1' })
  @ApiResponse({ status: 200, description: 'Administrador eliminado exitosamente.' })
  @ApiResponse({ status: 404, description: 'Administrador no encontrado.' })
  remove(@Param('id') id: string) {
    return this.adminService.remove(+id);
  }

  @Patch('verifications/:profileId')
  @ApiOperation({ summary: 'Verificar/rechazar conductor', description: 'Un administrador aprueba o rechaza la solicitud de verificación de un conductor.' })
  @ApiParam({ name: 'profileId', description: 'ID del perfil del conductor', example: 'uuid-1234-5678' })
  @ApiResponse({ status: 200, description: 'Verificación procesada exitosamente.' })
  @ApiResponse({ status: 404, description: 'Perfil no encontrado.' })
  verifyDriver(
    @Param('profileId') profileId: string,
    @Body() dto: VerifyDecisionDto,
  ) {
    return this.adminService.verifyDriver(profileId, dto);
  }
}
