import { Body, Controller, Delete, Get, Param, Patch, Post, Request, UploadedFiles, UseInterceptors } from '@nestjs/common';
import type { CreateUserDto } from './dto/create-user.dto';
import type { FileFieldsInterceptor } from '@nestjs/platform-express';
import type { UpdateUserDto } from './dto/update-user.dto';
import type { MulterFile } from './interfaces/multer-file.interface';
import type { UsersService } from './users.service';

@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Post()
  create(@Body() createUserDto: CreateUserDto) {
    return this.usersService.create(createUserDto);
  }

  @Get()
  findAll() {
    return this.usersService.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.usersService.findOne(+id);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() updateUserDto: UpdateUserDto) {
    return this.usersService.update(+id, updateUserDto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.usersService.remove(+id);
  }

	@Post('verify-request')
	@UseInterceptors(
		FileFieldsInterceptor([
			{ name: 'license', maxCount: 1 },
			{ name: 'insurance', maxCount: 1 },
		]),
	)
	async verifyRequest(
		@UploadedFiles() files: {
			license?: MulterFile[];
			insurance?: MulterFile[];
		},
		@Body('vehicleId') vehicleId: string,
		@Request() req: { user: { id: string } },
	) {
		return this.usersService.verifyRequest(req.user.id, vehicleId, files);
	}
}
