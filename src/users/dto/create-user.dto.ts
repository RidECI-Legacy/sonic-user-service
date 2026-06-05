import { IsString,  IsNotEmpty, IsEmail } from 'class-validator'
import { UserType } from '../enums/user-type.enums';

export class CreateUserDto {

    @IsString()
    @IsNotEmpty()
    id!: string;
    @IsString()
    @IsNotEmpty()
    name!: string;
    @IsEmail()
    @IsString()
    @IsNotEmpty()
    email!: string;
    @IsString()
    @IsNotEmpty()
    role!: UserType


}
