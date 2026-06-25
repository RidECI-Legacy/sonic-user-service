import { Injectable } from '@nestjs/common';
import { Prisma, Users } from 'generated/prisma';
import type { PrismaService } from './prisma.service';
@Injectable()
export class UsersService {
	constructor(private prisma: PrismaService) {}
}
