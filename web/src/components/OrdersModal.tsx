import React, { useEffect, useState } from 'react';
import { X, Package, CheckCircle2, Clock, Truck, ArrowRight, RefreshCw, Eye } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useCart } from '../context/CartContext';
import { ordersService } from '../services';
import { Order, OrderStatus } from '../types';

export const OrdersModal: React.FC = () => {
  const { isOrdersModalOpen, closeOrdersModal } = useCart();
  const { session } = useAuth();
  const [orders, setOrders] = useState<Order[]>([]);
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const fetchOrders = async () => {
    setIsLoading(true);
    try {
      const list = await ordersService.getOrders(session?.id);
      setOrders(list);
      if (list.length > 0 && !selectedOrder) {
        setSelectedOrder(list[0]);
      }
    } catch (err) {
      console.error('Error fetching orders:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (isOrdersModalOpen) {
      fetchOrders();
    }
  }, [isOrdersModalOpen, session]);

  if (!isOrdersModalOpen) return null;

  const getStatusBadge = (status: OrderStatus) => {
    switch (status) {
      case 'paid':
        return (
          <span className="bg-emerald-100 text-emerald-800 text-[11px] font-bold px-2 py-0.5 rounded-full flex items-center gap-1">
            <CheckCircle2 className="w-3 h-3" /> Pagado
          </span>
        );
      case 'shipped':
        return (
          <span className="bg-blue-100 text-blue-800 text-[11px] font-bold px-2 py-0.5 rounded-full flex items-center gap-1">
            <Truck className="w-3 h-3" /> En Camino
          </span>
        );
      case 'delivered':
        return (
          <span className="bg-purple-100 text-purple-800 text-[11px] font-bold px-2 py-0.5 rounded-full flex items-center gap-1">
            <CheckCircle2 className="w-3 h-3" /> Entregado
          </span>
        );
      case 'processing':
        return (
          <span className="bg-amber-100 text-amber-800 text-[11px] font-bold px-2 py-0.5 rounded-full flex items-center gap-1">
            <Clock className="w-3 h-3" /> Procesando
          </span>
        );
      default:
        return (
          <span className="bg-stone-100 text-stone-700 text-[11px] font-bold px-2 py-0.5 rounded-full flex items-center gap-1">
            <Clock className="w-3 h-3" /> Pendiente
          </span>
        );
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-stone-900/60 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="relative bg-white rounded-2xl max-w-4xl w-full overflow-hidden shadow-2xl border border-stone-200 animate-in fade-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="p-5 border-b border-stone-100 flex items-center justify-between bg-stone-50/50">
          <div className="flex items-center gap-2">
            <Package className="w-5 h-5 text-stone-900" />
            <h2 className="text-base font-bold text-stone-900">Historial de Pedidos (Orders Service)</h2>
            <span className="text-xs bg-stone-200 text-stone-700 px-2 py-0.5 rounded-full font-semibold">
              {orders.length}
            </span>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={fetchOrders}
              className="p-1.5 text-stone-500 hover:text-stone-800 hover:bg-stone-100 rounded-lg transition"
              title="Recargar órdenes"
            >
              <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
            </button>
            <button
              onClick={closeOrdersModal}
              className="p-1.5 text-stone-400 hover:text-stone-700 hover:bg-stone-100 rounded-lg transition"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="p-6">
          {isLoading ? (
            <div className="py-16 text-center text-xs text-stone-500">
              Cargando pedidos desde Orders Service...
            </div>
          ) : orders.length === 0 ? (
            <div className="py-12 text-center">
              <Package className="w-12 h-12 text-stone-300 mx-auto mb-3" />
              <h3 className="text-sm font-bold text-stone-800">No tienes pedidos registrados</h3>
              <p className="text-xs text-stone-500 mt-1 max-w-xs mx-auto">
                Realiza una compra para ver el seguimiento en tiempo real entre Orders y Payments.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
              {/* Order List (Left) */}
              <div className="lg:col-span-5 space-y-2.5 max-h-[460px] overflow-y-auto pr-1">
                {orders.map((order) => {
                  const isSelected = selectedOrder?.id === order.id;
                  return (
                    <div
                      key={order.id}
                      onClick={() => setSelectedOrder(order)}
                      className={`p-3.5 rounded-xl border cursor-pointer transition flex flex-col justify-between ${
                        isSelected
                          ? 'border-emerald-600 bg-emerald-50/30 shadow-xs ring-1 ring-emerald-600'
                          : 'border-stone-200 hover:border-stone-300 bg-white'
                      }`}
                    >
                      <div className="flex items-center justify-between mb-1.5">
                        <span className="font-mono font-bold text-xs text-stone-900">
                          {order.id}
                        </span>
                        {getStatusBadge(order.status)}
                      </div>

                      <div className="text-[11px] text-stone-500 mb-2">
                        {new Date(order.createdAt).toLocaleDateString('es-ES', {
                          day: '2-digit',
                          month: 'short',
                          year: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit'
                        })}
                      </div>

                      <div className="flex items-center justify-between text-xs pt-2 border-t border-stone-100">
                        <span className="text-stone-600 font-medium">
                          {order.items.reduce((s, i) => s + i.quantity, 0)} artículos
                        </span>
                        <span className="font-bold text-stone-900">
                          ${order.total.toFixed(2)}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Order Detail (Right) */}
              <div className="lg:col-span-7 bg-stone-50 rounded-2xl p-5 border border-stone-200 flex flex-col justify-between">
                {selectedOrder ? (
                  <div className="space-y-4 text-xs">
                    {/* Header */}
                    <div className="flex items-center justify-between pb-3 border-b border-stone-200">
                      <div>
                        <span className="text-stone-400">Detalles de Orden</span>
                        <h4 className="font-mono text-sm font-black text-stone-900">
                          {selectedOrder.id}
                        </h4>
                      </div>
                      {getStatusBadge(selectedOrder.status)}
                    </div>

                    {/* Timeline */}
                    <div className="bg-white p-3.5 rounded-xl border border-stone-200">
                      <span className="block font-semibold text-stone-700 mb-2">
                        Estado del Envío y Entrega:
                      </span>
                      <div className="flex items-center justify-between text-[10px] font-semibold text-stone-600">
                        <span className="text-emerald-700">✓ Recibido</span>
                        <span className="text-emerald-700">✓ Pagado</span>
                        <span className={selectedOrder.status === 'shipped' || selectedOrder.status === 'delivered' ? 'text-emerald-700' : 'text-stone-400'}>
                          ● En Tránsito
                        </span>
                        <span className={selectedOrder.status === 'delivered' ? 'text-emerald-700' : 'text-stone-400'}>
                          ● Entregado
                        </span>
                      </div>
                      {selectedOrder.trackingNumber && (
                        <div className="mt-2.5 pt-2 border-t border-stone-100 text-[11px] flex items-center justify-between">
                          <span className="text-stone-500">Nº de Seguimiento:</span>
                          <span className="font-mono font-bold text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded">
                            {selectedOrder.trackingNumber}
                          </span>
                        </div>
                      )}
                    </div>

                    {/* Items List */}
                    <div>
                      <span className="block font-semibold text-stone-700 mb-1.5">
                        Artículos del Pedido:
                      </span>
                      <div className="space-y-2 max-h-40 overflow-y-auto pr-1">
                        {selectedOrder.items.map((item) => (
                          <div
                            key={item.productId}
                            className="bg-white p-2.5 rounded-lg border border-stone-200 flex items-center justify-between"
                          >
                            <div className="flex items-center gap-2.5">
                              <img
                                src={item.imageUrl}
                                alt={item.title}
                                referrerPolicy="no-referrer"
                                className="w-10 h-10 rounded object-cover bg-stone-100"
                              />
                              <div>
                                <span className="font-bold text-stone-900 block truncate max-w-[200px]">
                                  {item.title}
                                </span>
                                <span className="text-stone-500 text-[11px]">
                                  {item.quantity} x ${item.price.toFixed(2)}
                                </span>
                              </div>
                            </div>
                            <span className="font-mono font-bold text-stone-900">
                              ${(item.price * item.quantity).toFixed(2)}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Delivery address & Payment info */}
                    <div className="grid grid-cols-2 gap-3 pt-2 border-t border-stone-200">
                      <div>
                        <span className="text-stone-400 block mb-0.5">Destino:</span>
                        <p className="font-medium text-stone-800">
                          {selectedOrder.shippingAddress.street}
                          <br />
                          {selectedOrder.shippingAddress.city}, {selectedOrder.shippingAddress.country}
                        </p>
                      </div>
                      <div>
                        <span className="text-stone-400 block mb-0.5">Pago:</span>
                        <p className="font-medium text-stone-800">
                          {selectedOrder.paymentMethod || 'Tarjeta Verificada'}
                        </p>
                        {selectedOrder.paymentId && (
                          <span className="font-mono text-[10px] text-stone-500">
                            ID: {selectedOrder.paymentId}
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Total */}
                    <div className="pt-2 border-t border-stone-200 flex justify-between items-center text-sm font-bold text-stone-900">
                      <span>Total Pagado:</span>
                      <span className="text-base text-emerald-800">${selectedOrder.total.toFixed(2)}</span>
                    </div>
                  </div>
                ) : (
                  <div className="h-full flex items-center justify-center text-xs text-stone-400">
                    Selecciona una orden de la lista
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
