import {
	IsArray,
	IsBoolean,
	IsInt,
	IsNotEmpty,
	IsNumber,
	IsOptional,
	IsString,
	Min,
	Max,
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

	@IsOptional()
	@IsString()
	category?: string;

	@IsOptional()
	@IsString()
	imageUrl?: string;

	@IsOptional()
	@IsNumber()
	@Min(0)
	@Max(5)
	rating?: number;

	@IsOptional()
	@IsInt()
	@Min(0)
	reviewsCount?: number;

	@IsOptional()
	@IsString()
	sku?: string;

	@IsOptional()
	@IsBoolean()
	isFeatured?: boolean;

	@IsOptional()
	@IsArray()
	tags?: string[];
}
