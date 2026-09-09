import {
	IsInt,
	IsNotEmpty,
	IsNumber,
	IsOptional,
	IsString,
	Min,
} from 'class-validator';

export class CreateProductDto {
	@IsString()
	@IsNotEmpty()
	name: string;

	@IsOptional()
	@IsString()
	description?: string;

	@IsNumber()
	@Min(0)
	price: number;

	@IsInt()
	@Min(0)
	stock: number;
}
