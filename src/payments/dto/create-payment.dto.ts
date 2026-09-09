import {
	IsNotEmpty,
	IsNumber,
	IsOptional,
	IsString,
	Min,
} from 'class-validator';

export class CreatePaymentDto {
	@IsString()
	@IsNotEmpty()
	orderId: string;

	@IsNumber()
	@Min(0.01)
	amount: number;

	@IsOptional()
	@IsString()
	provider?: string;
}
