export type PaymentStatus =
	| 'PENDING'
	| 'SUCCEEDED'
	| 'FAILED'
	| 'REFUNDED';

export class Payment {
	id: string;
	orderId: string;
	userId: string;
	amount: number;
	status: PaymentStatus;
	provider?: string;
	providerPaymentId?: string;
	createdAt: Date;
	updatedAt: Date;
}
