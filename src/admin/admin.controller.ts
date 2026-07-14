import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Res,
  UseGuards,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiParam,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import type { Response } from 'express';
import { AdminService } from './admin.service';
import { AssignRoleDto } from './dto/assign-role.dto';
import { CreateAdminDto } from './dto/create-admin.dto';
import { UpdateAdminDto } from './dto/update-admin.dto';
import { UpdateUserStatusDto } from './dto/update-user-status.dto';
import { VerifyDecisionDto } from './dto/verify-decision.dto';
import { AdminGuard } from '../common/guards/admin.guard';

@ApiTags('admin')
@ApiBearerAuth()
@UseGuards(AdminGuard)
@Controller('admin')
export class AdminController {
  constructor(private readonly adminService: AdminService) {}

  @Get('dashboard')
  @ApiOperation({
    summary: 'Dashboard admin',
    description:
      'Métricas generales de usuarios, conductores y calificaciones.',
  })
  @ApiResponse({ status: 200, description: 'Métricas obtenidas exitosamente.' })
  getDashboard() {
    return this.adminService.getDashboard();
  }

  @Patch('users/:id/status')
  @ApiOperation({
    summary: 'Suspender/activar usuario',
    description: 'Cambia el estado de un usuario (activo/suspendido).',
  })
  @ApiParam({
    name: 'id',
    description: 'ID del usuario',
    example: 'uuid-1234-5678',
  })
  @ApiResponse({ status: 200, description: 'Estado actualizado exitosamente.' })
  @ApiResponse({ status: 404, description: 'Usuario no encontrado.' })
  updateUserStatus(@Param('id') id: string, @Body() dto: UpdateUserStatusDto) {
    return this.adminService.updateUserStatus(id, dto);
  }

  @Get('users/pending-role')
  @ApiOperation({
    summary: 'Usuarios sin rol asignado',
    description:
      'Lista usuarios registrados sin rol, con dominio de email ECI válido y email confirmado en Supabase. Usuarios que no cumplan esos filtros no aparecen (auto-rechazados).',
  })
  @ApiResponse({ status: 200, description: 'Lista obtenida exitosamente.' })
  getPendingRoleUsers() {
    return this.adminService.getPendingRoleUsers();
  }

  @Patch('users/:id/role')
  @ApiOperation({
    summary: 'Asignar rol a usuario',
    description:
      'Asigna STUDENT o TEACHER_ADMINISTRATIVE a un usuario (decisión manual del admin).',
  })
  @ApiParam({
    name: 'id',
    description: 'ID del usuario',
    example: 'uuid-1234-5678',
  })
  @ApiResponse({ status: 200, description: 'Rol asignado exitosamente.' })
  @ApiResponse({ status: 404, description: 'Usuario no encontrado.' })
  assignUserRole(@Param('id') id: string, @Body() dto: AssignRoleDto) {
    return this.adminService.assignUserRole(id, dto);
  }

  @Get('reports/users')
  @ApiOperation({
    summary: 'Exportar reporte de usuarios',
    description:
      'Descarga un archivo Excel con el listado de usuarios y sus datos de perfil/reputación.',
  })
  @ApiResponse({
    status: 200,
    description: 'Archivo Excel generado exitosamente.',
  })
  async exportUsersReport(@Res() res: Response) {
    const buffer = await this.adminService.exportUsersReport();
    res.set({
      'Content-Type':
        'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'Content-Disposition': 'attachment; filename="usage-report.xlsx"',
    });
    res.send(buffer);
  }

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
