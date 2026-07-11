import { ValidationPipe } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );

  const config = new DocumentBuilder()
    .setTitle('Sonic User Service')
    .setDescription('API para la gestión de usuarios, autenticación, perfiles, vehículos y verificación de conductores')
    .setVersion('1.0')
    .addBearerAuth()
    .addTag('auth', 'Autenticación y registro de usuarios')
    .addTag('users', 'Gestión de usuarios')
    .addTag('admin', 'Gestión de administradores y verificaciones')
    .addTag('profile', 'Gestión de perfiles de usuario')
    .addTag('vehicles', 'Gestión de vehículos')
    .addTag('supabase', 'Configuración de Supabase')
    .build();

  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api', app, document);

  await app.listen(process.env.PORT!);
}
bootstrap();
