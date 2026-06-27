import { Module } from '@nestjs/common';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { PrismaModule } from '../prisma/prisma.module';
import { RabbitmqModule } from '../rabbitmq/rabbitmq.module';

@Module({
  imports: [PrismaModule, RabbitmqModule],
  controllers: [AuthController],
  providers: [AuthService],
})
export class AuthModule {}
