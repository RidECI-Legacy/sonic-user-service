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
import { CreateProfileDto } from './dto/create-profile.dto';
import { UpdateProfileDto } from './dto/update-profile.dto';
import { ProfileService } from './profile.service';

@ApiTags('profile')
@Controller('profile')
export class ProfileController {
  constructor(private readonly profileService: ProfileService) {}

  @Post()
  @ApiOperation({ summary: 'Crear perfil', description: 'Crea un nuevo perfil de usuario.' })
  @ApiResponse({ status: 201, description: 'Perfil creado exitosamente.' })
  @ApiResponse({ status: 400, description: 'Datos inválidos.' })
  create(@Body() createProfileDto: CreateProfileDto) {
    return this.profileService.create(createProfileDto);
  }

  @Get()
  @ApiOperation({ summary: 'Listar perfiles', description: 'Obtiene todos los perfiles de usuario.' })
  @ApiResponse({ status: 200, description: 'Lista de perfiles.' })
  findAll() {
    return this.profileService.findAll();
  }

  @Get(':id')
  @ApiOperation({ summary: 'Obtener perfil por ID', description: 'Obtiene un perfil específico por su ID.' })
  @ApiParam({ name: 'id', description: 'ID del perfil', example: 'uuid-1234-5678' })
  @ApiResponse({ status: 200, description: 'Perfil encontrado.' })
  @ApiResponse({ status: 404, description: 'Perfil no encontrado.' })
  findOne(@Param('id') id: string) {
    return this.profileService.findOne(+id);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Actualizar perfil', description: 'Actualiza parcialmente los datos de un perfil.' })
  @ApiParam({ name: 'id', description: 'ID del perfil', example: 'uuid-1234-5678' })
  @ApiResponse({ status: 200, description: 'Perfil actualizado exitosamente.' })
  @ApiResponse({ status: 404, description: 'Perfil no encontrado.' })
  update(@Param('id') id: string, @Body() updateProfileDto: UpdateProfileDto) {
    return this.profileService.update(+id, updateProfileDto);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Eliminar perfil', description: 'Elimina un perfil de la base de datos.' })
  @ApiParam({ name: 'id', description: 'ID del perfil', example: 'uuid-1234-5678' })
  @ApiResponse({ status: 200, description: 'Perfil eliminado exitosamente.' })
  @ApiResponse({ status: 404, description: 'Perfil no encontrado.' })
  remove(@Param('id') id: string) {
    return this.profileService.remove(+id);
  }
}
