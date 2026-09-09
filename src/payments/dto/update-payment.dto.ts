import { IsIn, IsOptional, IsString } from 'class-validator';

export class UpdatePaymentDto {
	@IsOptional()
	@IsString()
	@IsIn(['PENDING', 'SUCCEEDED', 'FAILED', 'REFUNDED'])
	status?: string;
}
