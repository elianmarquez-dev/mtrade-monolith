import { CreateOrderItemDto } from '../dto/create-order.dto';

export type OrderStatus = 'PENDING' | 'CONFIRMED' | 'CANCELLED';

export class Order {
	id: string;
	userId: string;
	status: OrderStatus;
	totalAmount: number;
	items: CreateOrderItemDto[];
	createdAt: Date;
	updatedAt: Date;
}
