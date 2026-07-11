import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Request,
  UploadedFiles,
  UseInterceptors,
} from '@nestjs/common';
import { ApiBearerAuth, ApiBody, ApiConsumes, ApiOperation, ApiParam, ApiResponse, ApiTags } from '@nestjs/swagger';
import { CreateUserDto } from './dto/create-user.dto';
import { FileFieldsInterceptor } from '@nestjs/platform-express';
import { UpdateUserDto } from './dto/update-user.dto';
import type { MulterFile } from './interfaces/multer-file.interface';
import { UsersService } from './users.service';

@ApiTags('users')
@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Post()
  @ApiOperation({ summary: 'Crear usuario', description: 'Crea un nuevo usuario en la base de datos local.' })
  @ApiResponse({ status: 201, description: 'Usuario creado exitosamente.' })
  @ApiResponse({ status: 400, description: 'Datos inválidos.' })
  create(@Body() createUserDto: CreateUserDto) {
    return this.usersService.create(createUserDto);
  }

  @Get()
  @ApiOperation({ summary: 'Listar usuarios', description: 'Obtiene todos los usuarios registrados.' })
  @ApiResponse({ status: 200, description: 'Lista de usuarios.' })
  findAll() {
    return this.usersService.findAll();
  }

  @Get(':id')
  @ApiOperation({ summary: 'Obtener usuario por ID', description: 'Obtiene un usuario específico por su ID.' })
  @ApiParam({ name: 'id', description: 'ID del usuario', example: '1' })
  @ApiResponse({ status: 200, description: 'Usuario encontrado.' })
  @ApiResponse({ status: 404, description: 'Usuario no encontrado.' })
  findOne(@Param('id') id: string) {
    return this.usersService.findOne(+id);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Actualizar usuario', description: 'Actualiza parcialmente los datos de un usuario.' })
  @ApiParam({ name: 'id', description: 'ID del usuario', example: '1' })
  @ApiResponse({ status: 200, description: 'Usuario actualizado exitosamente.' })
  @ApiResponse({ status: 404, description: 'Usuario no encontrado.' })
  update(@Param('id') id: string, @Body() updateUserDto: UpdateUserDto) {
    return this.usersService.update(+id, updateUserDto);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Eliminar usuario', description: 'Elimina un usuario de la base de datos.' })
  @ApiParam({ name: 'id', description: 'ID del usuario', example: '1' })
  @ApiResponse({ status: 200, description: 'Usuario eliminado exitosamente.' })
  @ApiResponse({ status: 404, description: 'Usuario no encontrado.' })
  remove(@Param('id') id: string) {
    return this.usersService.remove(+id);
  }

  @Post('verify-request')
  @ApiBearerAuth()
  @UseInterceptors(
    FileFieldsInterceptor([
      { name: 'license', maxCount: 1 },
      { name: 'insurance', maxCount: 1 },
    ]),
  )
  @ApiOperation({ summary: 'Solicitar verificación de conductor', description: 'Envía documentos (licencia y seguro) para verificación como conductor.' })
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        license: { type: 'string', format: 'binary', description: 'Imagen de la licencia de conducir' },
        insurance: { type: 'string', format: 'binary', description: 'Imagen del seguro del vehículo' },
        vehicleId: { type: 'string', description: 'ID del vehículo asociado' },
      },
    },
  })
  @ApiResponse({ status: 201, description: 'Solicitud de verificación enviada.' })
  @ApiResponse({ status: 401, description: 'No autenticado.' })
  async verifyRequest(
    @UploadedFiles()
    files: {
      license?: MulterFile[];
      insurance?: MulterFile[];
    },
    @Body('vehicleId') vehicleId: string,
    @Request() req: { user: { id: string } },
  ) {
    return this.usersService.verifyRequest(req.user.id, vehicleId, files);
  }
}
