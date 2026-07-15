import {
  Body,
  Controller,
  ForbiddenException,
  Get,
  Param,
  Patch,
  Post,
  Query,
  Request,
  UploadedFile,
  UploadedFiles,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiBody,
  ApiConsumes,
  ApiOperation,
  ApiParam,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import {
  FileFieldsInterceptor,
  FileInterceptor,
} from '@nestjs/platform-express';
import {
  DOCUMENT_UPLOAD_OPTIONS,
  IMAGE_UPLOAD_OPTIONS,
} from '../common/upload/file-upload';
import { UpdateProfileSelfDto } from './dto/update-profile-self.dto';
import type { MulterFile } from './interfaces/multer-file.interface';
import { UsersService } from './users.service';
import { SupabaseAuthGuard } from '../common/guards/supabase-auth.guard';
import type { AuthenticatedRequest } from '../common/interfaces/authenticated-request.interface';
import { RatingsService } from '../ratings/ratings.service';
import { TripsHistoryQueryDto } from '../ratings/dto/trips-history-query.dto';

@ApiTags('users')
@Controller('users')
export class UsersController {
  constructor(
    private readonly usersService: UsersService,
    private readonly ratingsService: RatingsService,
  ) {}

  @Post('verify-request')
  @UseGuards(SupabaseAuthGuard)
  @ApiBearerAuth()
  @UseInterceptors(
    FileFieldsInterceptor(
      [
        { name: 'license', maxCount: 1 },
        { name: 'insurance', maxCount: 1 },
      ],
      DOCUMENT_UPLOAD_OPTIONS,
    ),
  )
  @ApiOperation({
    summary: 'Solicitar verificación de conductor',
    description:
      'Envía documentos (licencia y seguro) para verificación como conductor.',
  })
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        license: {
          type: 'string',
          format: 'binary',
          description: 'Imagen de la licencia de conducir',
        },
        insurance: {
          type: 'string',
          format: 'binary',
          description: 'Imagen del seguro del vehículo',
        },
        vehicleId: { type: 'string', description: 'ID del vehículo asociado' },
      },
    },
  })
  @ApiResponse({
    status: 201,
    description: 'Solicitud de verificación enviada.',
  })
  @ApiResponse({ status: 401, description: 'No autenticado.' })
  async verifyRequest(
    @UploadedFiles()
    files: {
      license?: MulterFile[];
      insurance?: MulterFile[];
    },
    @Body('vehicleId') vehicleId: string,
    @Request() req: AuthenticatedRequest,
  ) {
    return this.usersService.verifyRequest(req.user!.id, vehicleId, files);
  }

  @Get(':id/profile')
  @UseGuards(SupabaseAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Obtener perfil',
    description:
      'Obtiene el perfil público (nombre, foto, reputación, distintivos). El email, teléfono y documento solo se devuelven al dueño del perfil.',
  })
  @ApiParam({
    name: 'id',
    description: 'ID del usuario',
    example: 'uuid-1234-5678',
  })
  @ApiResponse({ status: 200, description: 'Perfil encontrado.' })
  @ApiResponse({ status: 401, description: 'No autenticado.' })
  @ApiResponse({ status: 404, description: 'Usuario no encontrado.' })
  getProfile(@Param('id') id: string, @Request() req: AuthenticatedRequest) {
    return this.usersService.getProfile(id, req.user!.id);
  }

  @Patch(':id/profile')
  @UseGuards(SupabaseAuthGuard)
  @ApiBearerAuth()
  @UseInterceptors(FileInterceptor('photo', IMAGE_UPLOAD_OPTIONS))
  @ApiOperation({
    summary: 'Actualizar perfil propio',
    description:
      'Permite al usuario editar nombre, teléfono, tipo de documento y foto de su propio perfil.',
  })
  @ApiParam({
    name: 'id',
    description: 'ID del usuario',
    example: 'uuid-1234-5678',
  })
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        name: { type: 'string', description: 'Nombre completo del usuario' },
        phone: { type: 'string', description: 'Teléfono del usuario' },
        documentType: {
          type: 'string',
          description: 'Tipo de documento de identidad',
        },
        photo: {
          type: 'string',
          format: 'binary',
          description: 'Foto de perfil',
        },
      },
    },
  })
  @ApiResponse({ status: 200, description: 'Perfil actualizado exitosamente.' })
  @ApiResponse({ status: 401, description: 'No autenticado.' })
  @ApiResponse({
    status: 403,
    description: 'Solo puedes editar tu propio perfil.',
  })
  @ApiResponse({ status: 404, description: 'Usuario o perfil no encontrado.' })
  updateProfile(
    @Param('id') id: string,
    @Body() dto: UpdateProfileSelfDto,
    @UploadedFile() photo: MulterFile | undefined,
    @Request() req: AuthenticatedRequest,
  ) {
    if (!req.user || req.user.id !== id) {
      throw new ForbiddenException('You can only edit your own profile');
    }
    return this.usersService.updateProfile(id, dto, photo);
  }

  @Get(':id/trips-history')
  @UseGuards(SupabaseAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Historial de viajes calificados',
    description:
      'Lista paginada de viajes pasados con la calificación recibida por el usuario. Solo el dueño puede consultar su propio historial.',
  })
  @ApiParam({
    name: 'id',
    description: 'ID del usuario',
    example: 'uuid-1234-5678',
  })
  @ApiResponse({ status: 200, description: 'Historial obtenido exitosamente.' })
  @ApiResponse({ status: 401, description: 'No autenticado.' })
  @ApiResponse({
    status: 403,
    description: 'Solo puedes ver tu propio historial.',
  })
  getTripsHistory(
    @Param('id') id: string,
    @Query() query: TripsHistoryQueryDto,
    @Request() req: AuthenticatedRequest,
  ) {
    if (!req.user || req.user.id !== id) {
      throw new ForbiddenException('You can only view your own trip history');
    }
    return this.ratingsService.getTripsHistory(id, query);
  }
}
