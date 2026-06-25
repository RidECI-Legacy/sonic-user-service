import { Controller, Get, Patch, Param, Body } from '@nestjs/common';
import { AdminService } from './admin.service';
import { VerifyDecisionDto } from './dto/verify-decision.dto';

@Controller('admin')
export class AdminController {
  constructor(private readonly adminService: AdminService) {}

  @Get('verifications/pending')
  findPendingVerifications() {
    return this.adminService.findPendingVerifications();
  }

  @Patch('verifications/:profileId')
  verifyDriver(
    @Param('profileId') profileId: string,
    @Body() dto: VerifyDecisionDto,
  ) {
    return this.adminService.verifyDriver(profileId, dto);
  }
}
