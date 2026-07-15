import { ApiProperty } from '@nestjs/swagger';
import { VehicleType } from '@prisma/client';
import { IsEnum, IsNotEmpty, IsString } from 'class-validator';

export class CreateVehicleDto {
  @ApiProperty({ example: 'Toyota', description: 'Marca del vehículo' })
  @IsString()
  @IsNotEmpty()
  brand!: string;

  @ApiProperty({ example: 'Corolla', description: 'Modelo del vehículo' })
  @IsString()
  @IsNotEmpty()
  model!: string;

  @ApiProperty({ example: 'ABC-123', description: 'Placa del vehículo' })
  @IsString()
  @IsNotEmpty()
  plate!: string;

  @ApiProperty({
    enum: VehicleType,
    example: VehicleType.CAR,
    description: 'Tipo de vehículo',
  })
  @IsEnum(VehicleType)
  type!: VehicleType;
}
