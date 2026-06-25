import { Body, Controller, Delete, Get, Param, Patch, Post } from '@nestjs/common';
import type { AuthService } from './auth.service';
import { CreateAuthDto } from './dto/create-auth.dto';
import { UpdateAuthDto } from './dto/update-auth.dto';

@Controller('auth')
export class AuthController {
	constructor(private readonly authService: AuthService) {}
}
