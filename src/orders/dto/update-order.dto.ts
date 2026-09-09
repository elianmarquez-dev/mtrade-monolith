import {
	ArrayMinSize,
	IsArray,
	IsInt,
	IsNumber,
	IsOptional,
	IsString,
	Min,
	ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';
import { CreateOrderItemDto } from './create-order.dto';

export class UpdateOrderDto {
	@IsOptional()
	@IsArray()
	@ArrayMinSize(1)
	@ValidateNested({ each: true })
	@Type(() => CreateOrderItemDto)
	items?: CreateOrderItemDto[];

	@IsOptional()
	@IsNumber()
	@Min(0)
	totalAmount?: number;

	@IsOptional()
	@IsString()
	status?: string;
}
