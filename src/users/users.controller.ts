import { Controller, Post, Body, UploadedFiles, UseInterceptors, Request } from '@nestjs/common';
import { FileFieldsInterceptor } from '@nestjs/platform-express';
import { UsersService } from './users.service';

interface MulterFile {
  buffer: Buffer;
  originalname: string;
  mimetype: string;
}

@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Post('verify-request')
  @UseInterceptors(
    FileFieldsInterceptor([
      { name: 'license', maxCount: 1 },
      { name: 'plateImage', maxCount: 1 },
      { name: 'insurance', maxCount: 1 },
    ]),
  )
  async verifyRequest(
    @UploadedFiles() files: {
      license?: MulterFile[];
      plateImage?: MulterFile[];
      insurance?: MulterFile[];
    },
    @Body('vehicleId') vehicleId: string,
    @Request() req: { user: { id: string } },
  ) {
    return this.usersService.verifyRequest(req.user.id, vehicleId, files);
  }
}
