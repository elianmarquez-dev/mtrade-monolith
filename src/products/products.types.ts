export type ProductStatus = 'ACTIVE' | 'INACTIVE';

export type Product = {
  id: string;
  ownerId: string;
  name: string;
  description?: string;
  price: number;
  stock: number;
  status: ProductStatus;
  createdAt: Date;
  updatedAt: Date;
};