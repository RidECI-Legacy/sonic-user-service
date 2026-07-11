import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString } from 'class-validator';
import type { VehicleType } from 'src/users/enums/vehicle-type.enum';

export class CreateVehicleDto {
  @ApiProperty({ example: 'uuid-1234-5678', description: 'ID único del vehículo' })
  @IsString()
  @IsNotEmpty()
  id!: string;

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

  @ApiProperty({ example: 'car', description: 'Tipo de vehículo (car, motorcycle)' })
  @IsString()
  @IsNotEmpty()
  type!: VehicleType;
}
