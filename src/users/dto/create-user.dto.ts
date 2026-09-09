import { IsEmail, IsNotEmpty, IsOptional, IsString, MinLength } from 'class-validator';

export class CreateUserDto {
	@IsEmail()
	@IsNotEmpty()
	email: string;

	@IsOptional()
	@IsString()
	@MinLength(2)
	firstName?: string;

	@IsOptional()
	@IsString()
	@MinLength(2)
	lastName?: string;
}
