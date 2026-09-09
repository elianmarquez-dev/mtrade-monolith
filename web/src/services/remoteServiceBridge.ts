import { authService } from './authService';
import { ordersService } from './ordersService';
import { paymentsService } from './paymentsService';
import { productsService } from './productsService';
import { usersService } from './usersService';

export const remoteServiceBridge = {
  authService,
  ordersService,
  paymentsService,
  productsService,
  usersService,
};
