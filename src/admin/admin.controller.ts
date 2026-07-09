import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
} from '@nestjs/common';
import { AdminService } from './admin.service';
import type { CreateAdminDto } from './dto/create-admin.dto';
import type { UpdateAdminDto } from './dto/update-admin.dto';
import type { VerifyDecisionDto } from './dto/verify-decision.dto';

@Controller('admin')
export class AdminController {
  constructor(private readonly adminService: AdminService) {}

  @Post()
  create(@Body() createAdminDto: CreateAdminDto) {
    return this.adminService.create(createAdminDto);
  }

  @Get()
  findAll() {
    return this.adminService.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.adminService.findOne(+id);
  }
  @Get('verifications/pending')
  findPendingVerifications() {
    return this.adminService.findPendingVerifications();
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() updateAdminDto: UpdateAdminDto) {
    return this.adminService.update(+id, updateAdminDto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.adminService.remove(+id);
  }
  @Patch('verifications/:profileId')
  verifyDriver(
    @Param('profileId') profileId: string,
    @Body() dto: VerifyDecisionDto,
  ) {
    return this.adminService.verifyDriver(profileId, dto);
  }
}
