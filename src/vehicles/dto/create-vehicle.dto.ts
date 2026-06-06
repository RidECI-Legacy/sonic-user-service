import { IsString, IsNotEmpty } from "class-validator";
import { VehicleType } from "src/users/enums/vehicle-type.enum";

export class CreateVehicleDto {
    @IsString()
    @IsNotEmpty()
    id!: string;
    @IsString()
    @IsNotEmpty()
    brand!: string;
    @IsString()
    @IsNotEmpty()
    model!: string;
    @IsString()
    @IsNotEmpty()
    plate!: string;
    @IsString()
    @IsNotEmpty()
    type!: VehicleType

}
