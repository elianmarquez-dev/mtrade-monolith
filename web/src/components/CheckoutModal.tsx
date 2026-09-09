import React, { useEffect, useState } from 'react';
import {
  X,
  MapPin,
  CreditCard,
  CheckCircle2,
  Lock,
  ArrowLeft,
  ArrowRight,
  ShieldCheck,
  Building2,
  Wallet,
  Loader2,
  Sparkles
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useCart } from '../context/CartContext';
import { ordersService, paymentsService, productsService, usersService } from '../services';
import { Order, PaymentMethodType, UserAddress } from '../types';

export const CheckoutModal: React.FC = () => {
  const { isCheckoutOpen, closeCheckout, items, subtotal, shippingFee, tax, total, clearCart, setLastCreatedOrder } = useCart();
  const { session, profile } = useAuth();

  // Multi-step: 1 = Shipping, 2 = Payment Method, 3 = Processing, 4 = Confirmation
  const [step, setStep] = useState<1 | 2 | 3 | 4>(1);

  // Address state
  const [addresses, setAddresses] = useState<UserAddress[]>([]);
  const [selectedAddressId, setSelectedAddressId] = useState<string>('');
  const [customAddress, setCustomAddress] = useState<Omit<UserAddress, 'id'>>({
    label: 'Nueva Dirección',
    street: '',
    city: '',
    state: '',
    postalCode: '',
    country: 'España',
    isDefault: false
  });
  const [isUsingCustomAddress, setIsUsingCustomAddress] = useState(false);

  // Payment state
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethodType>('credit_card');
  const [cardNumber, setCardNumber] = useState('4242 •••• •••• 4242');
  const [cardHolder, setCardHolder] = useState(session?.name || 'Titular');
  const [cardExpiry, setCardExpiry] = useState('12/28');
  const [cardCvv, setCardCvv] = useState('888');

  // Checkout Result
  const [createdOrder, setCreatedOrder] = useState<Order | null>(null);
  const [paymentAuthCode, setPaymentAuthCode] = useState<string>('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Load addresses from Users Service
  useEffect(() => {
    if (isCheckoutOpen && session) {
      const loadAddrs = async () => {
        try {
          const addrs = await usersService.getAddresses(session.id);
          setAddresses(addrs);
          if (addrs.length > 0) {
            const def = addrs.find((a) => a.isDefault) || addrs[0];
            setSelectedAddressId(def.id);
          } else {
            setIsUsingCustomAddress(true);
          }
        } catch (err) {
          console.error('Error fetching addresses from Users Service:', err);
        }
      };
      loadAddrs();
    }
  }, [isCheckoutOpen, session]);

  if (!isCheckoutOpen) return null;

  const getEffectiveAddress = (): UserAddress => {
    if (!isUsingCustomAddress && selectedAddressId) {
      const found = addresses.find((a) => a.id === selectedAddressId);
      if (found) return found;
    }
    return {
      id: 'addr-temp',
      ...customAddress
    };
  };

  const handleProceedToPayment = () => {
    const addr = getEffectiveAddress();
    if (!addr.street || !addr.city) {
      setErrorMessage('Por favor ingresa la calle y ciudad de entrega.');
      return;
    }
    setErrorMessage(null);
    setStep(2);
  };

  const handleExecuteCheckout = async () => {
    setIsProcessing(true);
    setErrorMessage(null);
    setStep(3);

    try {
      const shippingAddress = getEffectiveAddress();

      // 1. Users Service: Save address if it was custom
      if (isUsingCustomAddress && session) {
        try {
          await usersService.addAddress(session.id, customAddress);
        } catch {
          // non-blocking
        }
      }

      // 2. Orders Service: Create initial Order
      const newOrder = await ordersService.createOrder({
        userId: session ? session.id : 'guest-usr',
        customerName: session ? session.name : 'Cliente Invitado',
        customerEmail: session ? session.email : 'invitado@ecommerce.modular',
        items,
        shippingAddress
      });

      // 3. Payments Service: Process Payment Charge
      const paymentTx = await paymentsService.processPayment({
        orderId: newOrder.id,
        amount: newOrder.total,
        currency: 'USD',
        method: paymentMethod,
        cardDetails:
          paymentMethod === 'credit_card' || paymentMethod === 'debit_card'
            ? {
                cardNumber,
                cardHolder,
                expiryDate: cardExpiry,
                cvv: cardCvv
              }
            : undefined
      });

      // 4. Products Service: Deduct inventory stock
      await productsService.deductStock(
        items.map((i) => ({ productId: i.product.id, quantity: i.quantity }))
      );

      // 5. Orders Service: Update order status to 'paid' with paymentId
      const finalOrder = await ordersService.updateOrderStatus(
        newOrder.id,
        'paid',
        paymentTx.id,
        paymentMethod === 'credit_card'
          ? 'Tarjeta de Crédito (Visa •••• 4242)'
          : paymentMethod === 'paypal'
          ? 'PayPal Checkout'
          : 'Transferencia Bancaria'
      );

      setCreatedOrder(finalOrder);
      setPaymentAuthCode(paymentTx.authorizationCode);
      setLastCreatedOrder(finalOrder);
      clearCart();
      setStep(4);
    } catch (err: any) {
      console.error('Checkout failure in modular services:', err);
      setErrorMessage(err.message || 'Ocurrió un error al procesar la orden en los servicios.');
      setStep(2);
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-stone-900/60 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="relative bg-white rounded-2xl max-w-2xl w-full overflow-hidden shadow-2xl border border-stone-200 animate-in fade-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="p-5 border-b border-stone-100 flex items-center justify-between bg-stone-50/50">
          <div className="flex items-center gap-2">
            <Lock className="w-4 h-4 text-emerald-600" />
            <h2 className="text-base font-bold text-stone-900">Checkout Seguro Monolito</h2>
          </div>
          {step !== 3 && (
            <button
              onClick={closeCheckout}
              className="p-1.5 text-stone-400 hover:text-stone-700 hover:bg-stone-100 rounded-lg transition"
            >
              <X className="w-5 h-5" />
            </button>
          )}
        </div>

        {/* Step Indicator */}
        <div className="px-6 py-3 bg-white border-b border-stone-100 flex items-center justify-between text-xs">
          <div
            className={`flex items-center gap-1.5 font-semibold ${
              step >= 1 ? 'text-emerald-700' : 'text-stone-400'
            }`}
          >
            <span className="w-5 h-5 rounded-full bg-emerald-100 text-emerald-800 flex items-center justify-center text-[11px] font-bold">
              1
            </span>
            <span>Envío (Users)</span>
          </div>
          <div className="h-0.5 w-8 bg-stone-200" />
          <div
            className={`flex items-center gap-1.5 font-semibold ${
              step >= 2 ? 'text-emerald-700' : 'text-stone-400'
            }`}
          >
            <span className="w-5 h-5 rounded-full bg-emerald-100 text-emerald-800 flex items-center justify-center text-[11px] font-bold">
              2
            </span>
            <span>Pago (Payments)</span>
          </div>
          <div className="h-0.5 w-8 bg-stone-200" />
          <div
            className={`flex items-center gap-1.5 font-semibold ${
              step === 4 ? 'text-emerald-700' : 'text-stone-400'
            }`}
          >
            <span className="w-5 h-5 rounded-full bg-emerald-100 text-emerald-800 flex items-center justify-center text-[11px] font-bold">
              3
            </span>
            <span>Confirmación (Orders)</span>
          </div>
        </div>

        {errorMessage && (
          <div className="mx-6 mt-4 p-3 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-700">
            {errorMessage}
          </div>
        )}

        {/* Body Content by Step */}
        <div className="p-6">
          {/* STEP 1: SHIPPING ADDRESS */}
          {step === 1 && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-bold text-stone-900 flex items-center gap-2">
                  <MapPin className="w-4 h-4 text-emerald-600" />
                  <span>Dirección de Entrega (Users Service)</span>
                </h3>
                {addresses.length > 0 && (
                  <button
                    onClick={() => setIsUsingCustomAddress(!isUsingCustomAddress)}
                    className="text-xs text-emerald-700 hover:text-emerald-800 font-semibold"
                  >
                    {isUsingCustomAddress ? 'Usar dirección guardada' : '+ Nueva dirección'}
                  </button>
                )}
              </div>

              {!isUsingCustomAddress && addresses.length > 0 ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {addresses.map((addr) => (
                    <label
                      key={addr.id}
                      onClick={() => setSelectedAddressId(addr.id)}
                      className={`p-3.5 rounded-xl border cursor-pointer transition flex flex-col justify-between ${
                        selectedAddressId === addr.id
                          ? 'border-emerald-600 bg-emerald-50/40 ring-1 ring-emerald-600'
                          : 'border-stone-200 hover:border-stone-300 bg-white'
                      }`}
                    >
                      <div className="flex items-center justify-between mb-1.5">
                        <span className="text-xs font-bold text-stone-900">{addr.label}</span>
                        {addr.isDefault && (
                          <span className="text-[10px] bg-stone-100 text-stone-600 px-1.5 py-0.5 rounded font-medium">
                            Predeterminada
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-stone-600 leading-relaxed">
                        {addr.street}
                        <br />
                        {addr.city}, {addr.postalCode} - {addr.country}
                      </p>
                    </label>
                  ))}
                </div>
              ) : (
                <div className="space-y-3 bg-stone-50 p-4 rounded-xl border border-stone-200 text-xs">
                  <div>
                    <label className="block font-semibold text-stone-700 mb-1">Nombre o Etiqueta:</label>
                    <input
                      type="text"
                      value={customAddress.label}
                      onChange={(e) => setCustomAddress({ ...customAddress, label: e.target.value })}
                      placeholder="Ej: Casa, Oficina, Departamento"
                      className="w-full bg-white border border-stone-300 rounded-lg p-2 text-stone-900"
                    />
                  </div>
                  <div>
                    <label className="block font-semibold text-stone-700 mb-1">Calle y Número:</label>
                    <input
                      type="text"
                      value={customAddress.street}
                      onChange={(e) => setCustomAddress({ ...customAddress, street: e.target.value })}
                      placeholder="Av. Paseo 1234, Depto 4"
                      className="w-full bg-white border border-stone-300 rounded-lg p-2 text-stone-900"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="block font-semibold text-stone-700 mb-1">Ciudad:</label>
                      <input
                        type="text"
                        value={customAddress.city}
                        onChange={(e) => setCustomAddress({ ...customAddress, city: e.target.value })}
                        placeholder="Madrid"
                        className="w-full bg-white border border-stone-300 rounded-lg p-2 text-stone-900"
                      />
                    </div>
                    <div>
                      <label className="block font-semibold text-stone-700 mb-1">Código Postal:</label>
                      <input
                        type="text"
                        value={customAddress.postalCode}
                        onChange={(e) => setCustomAddress({ ...customAddress, postalCode: e.target.value })}
                        placeholder="28001"
                        className="w-full bg-white border border-stone-300 rounded-lg p-2 text-stone-900"
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* Order Summary Mini Box */}
              <div className="bg-stone-50 rounded-xl p-3.5 border border-stone-200 mt-4 text-xs space-y-1">
                <div className="flex justify-between text-stone-600">
                  <span>Artículos en la orden:</span>
                  <span className="font-semibold text-stone-900">{items.length} productos</span>
                </div>
                <div className="flex justify-between text-stone-600">
                  <span>Total estimado con envío e IVA:</span>
                  <span className="font-bold text-emerald-800 text-sm">${total.toFixed(2)}</span>
                </div>
              </div>

              <div className="flex justify-end pt-3">
                <button
                  onClick={handleProceedToPayment}
                  className="px-5 py-2.5 bg-stone-900 hover:bg-stone-800 text-white rounded-xl text-xs font-bold flex items-center gap-2 transition"
                >
                  <span>Continuar a Pago</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}

          {/* STEP 2: PAYMENT METHOD & REVIEW */}
          {step === 2 && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-bold text-stone-900 flex items-center gap-2">
                  <CreditCard className="w-4 h-4 text-emerald-600" />
                  <span>Método de Pago (Payments Service)</span>
                </h3>
                <span className="text-xs font-mono text-stone-400">SSL 256-Bit Encrypted</span>
              </div>

              {/* Payment selector tabs */}
              <div className="grid grid-cols-3 gap-2">
                <button
                  type="button"
                  onClick={() => setPaymentMethod('credit_card')}
                  className={`p-3 rounded-xl border text-left text-xs transition cursor-pointer flex flex-col gap-1.5 ${
                    paymentMethod === 'credit_card'
                      ? 'border-emerald-600 bg-emerald-50/50 font-bold text-emerald-900 ring-1 ring-emerald-600'
                      : 'border-stone-200 hover:border-stone-300 text-stone-700 bg-white'
                  }`}
                >
                  <CreditCard className="w-4 h-4 text-emerald-600" />
                  <span>Tarjeta Crédito</span>
                </button>

                <button
                  type="button"
                  onClick={() => setPaymentMethod('paypal')}
                  className={`p-3 rounded-xl border text-left text-xs transition cursor-pointer flex flex-col gap-1.5 ${
                    paymentMethod === 'paypal'
                      ? 'border-emerald-600 bg-emerald-50/50 font-bold text-emerald-900 ring-1 ring-emerald-600'
                      : 'border-stone-200 hover:border-stone-300 text-stone-700 bg-white'
                  }`}
                >
                  <Wallet className="w-4 h-4 text-blue-600" />
                  <span>PayPal Wallet</span>
                </button>

                <button
                  type="button"
                  onClick={() => setPaymentMethod('bank_transfer')}
                  className={`p-3 rounded-xl border text-left text-xs transition cursor-pointer flex flex-col gap-1.5 ${
                    paymentMethod === 'bank_transfer'
                      ? 'border-emerald-600 bg-emerald-50/50 font-bold text-emerald-900 ring-1 ring-emerald-600'
                      : 'border-stone-200 hover:border-stone-300 text-stone-700 bg-white'
                  }`}
                >
                  <Building2 className="w-4 h-4 text-stone-700" />
                  <span>Transferencia</span>
                </button>
              </div>

              {/* Method Details Form */}
              {paymentMethod === 'credit_card' && (
                <div className="p-4 bg-stone-50 rounded-xl border border-stone-200 space-y-3 text-xs">
                  <div>
                    <label className="block font-semibold text-stone-700 mb-1">Número de Tarjeta:</label>
                    <input
                      type="text"
                      value={cardNumber}
                      onChange={(e) => setCardNumber(e.target.value)}
                      placeholder="4242 4242 4242 4242"
                      className="w-full bg-white border border-stone-300 rounded-lg p-2 font-mono text-stone-900"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block font-semibold text-stone-700 mb-1">Titular:</label>
                      <input
                        type="text"
                        value={cardHolder}
                        onChange={(e) => setCardHolder(e.target.value)}
                        className="w-full bg-white border border-stone-300 rounded-lg p-2 text-stone-900"
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <label className="block font-semibold text-stone-700 mb-1">Vence:</label>
                        <input
                          type="text"
                          value={cardExpiry}
                          onChange={(e) => setCardExpiry(e.target.value)}
                          placeholder="MM/AA"
                          className="w-full bg-white border border-stone-300 rounded-lg p-2 text-stone-900 font-mono"
                        />
                      </div>
                      <div>
                        <label className="block font-semibold text-stone-700 mb-1">CVV:</label>
                        <input
                          type="password"
                          maxLength={4}
                          value={cardCvv}
                          onChange={(e) => setCardCvv(e.target.value)}
                          placeholder="123"
                          className="w-full bg-white border border-stone-300 rounded-lg p-2 text-stone-900 font-mono"
                        />
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {paymentMethod === 'paypal' && (
                <div className="p-4 bg-blue-50/50 rounded-xl border border-blue-200 text-xs text-blue-900 space-y-1">
                  <p className="font-semibold">Conexión con cuenta PayPal:</p>
                  <p className="text-stone-600">
                    Se autorizará un débito instantáneo de <strong>${total.toFixed(2)} USD</strong> mediante el token de sesión de Payments Service.
                  </p>
                </div>
              )}

              {paymentMethod === 'bank_transfer' && (
                <div className="p-4 bg-stone-50 rounded-xl border border-stone-200 text-xs text-stone-700 space-y-1">
                  <p className="font-semibold text-stone-900">Transferencia Instantánea SEPA / Red Bancaria:</p>
                  <p className="text-stone-600">
                    El servicio de pagos emitirá una confirmación digital inmediata con código de autorización bancario.
                  </p>
                </div>
              )}

              {/* Price Breakdown */}
              <div className="border-t border-stone-200 pt-3 space-y-1 text-xs">
                <div className="flex justify-between text-stone-600">
                  <span>Subtotal productos:</span>
                  <span>${subtotal.toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-stone-600">
                  <span>Coste de envío:</span>
                  <span>{shippingFee === 0 ? 'Gratis' : `$${shippingFee.toFixed(2)}`}</span>
                </div>
                <div className="flex justify-between text-stone-600">
                  <span>Impuestos (21% IVA):</span>
                  <span>${tax.toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-sm font-extrabold text-stone-900 pt-2 border-t border-stone-100">
                  <span>Total a Cobrar:</span>
                  <span className="text-base text-emerald-800">${total.toFixed(2)}</span>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center justify-between pt-3">
                <button
                  type="button"
                  onClick={() => setStep(1)}
                  className="px-4 py-2 border border-stone-200 text-stone-700 rounded-xl text-xs font-semibold hover:bg-stone-50 flex items-center gap-1.5 transition"
                >
                  <ArrowLeft className="w-3.5 h-3.5" />
                  <span>Volver a Envío</span>
                </button>

                <button
                  type="button"
                  onClick={handleExecuteCheckout}
                  className="px-6 py-2.5 bg-emerald-700 hover:bg-emerald-800 text-white rounded-xl text-xs font-bold flex items-center gap-2 transition shadow-md cursor-pointer"
                >
                  <ShieldCheck className="w-4 h-4" />
                  <span>Autorizar y Pagar ${total.toFixed(2)}</span>
                </button>
              </div>
            </div>
          )}

          {/* STEP 3: PROCESSING OVERLAY */}
          {step === 3 && (
            <div className="py-12 flex flex-col items-center justify-center text-center space-y-4">
              <div className="relative">
                <Loader2 className="w-12 h-12 text-emerald-600 animate-spin" />
                <div className="absolute inset-0 flex items-center justify-center">
                  <span className="h-4 w-4 bg-emerald-600 rounded-full animate-ping opacity-20" />
                </div>
              </div>
              <h3 className="text-base font-bold text-stone-900">
                Coordinando Monolito Modular...
              </h3>
              <div className="space-y-1 text-xs text-stone-500 font-mono max-w-xs mx-auto">
                <p>1. Users Service: validando cuenta...</p>
                <p>2. Orders Service: instanciando orden...</p>
                <p>3. Payments Service: procesando cargo...</p>
                <p>4. Products Service: reservando inventario...</p>
              </div>
            </div>
          )}

          {/* STEP 4: CONFIRMATION & RECEIPT */}
          {step === 4 && createdOrder && (
            <div className="space-y-5 animate-in fade-in zoom-in-95 duration-200">
              <div className="text-center">
                <div className="w-12 h-12 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center mx-auto mb-2">
                  <CheckCircle2 className="w-7 h-7" />
                </div>
                <h3 className="text-lg font-black text-stone-900">
                  ¡Orden Confirmada con Éxito!
                </h3>
                <p className="text-xs text-stone-500 mt-0.5">
                  Procesada por los 5 servicios del Monolito Modular
                </p>
              </div>

              {/* Order Card Receipt */}
              <div className="bg-stone-50 rounded-xl p-4 border border-stone-200 text-xs space-y-3">
                <div className="flex items-center justify-between pb-2 border-b border-stone-200">
                  <div>
                    <span className="text-stone-400 font-medium">Nº de Orden:</span>
                    <strong className="font-mono text-stone-900 ml-1.5">{createdOrder.id}</strong>
                  </div>
                  <span className="bg-emerald-100 text-emerald-800 font-bold px-2 py-0.5 rounded text-[11px] uppercase tracking-wide">
                    Estado: {createdOrder.status}
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-2 text-stone-600">
                  <div>
                    <span className="block text-stone-400 text-[11px]">Código de Autorización:</span>
                    <span className="font-mono font-semibold text-stone-800">{paymentAuthCode}</span>
                  </div>
                  <div>
                    <span className="block text-stone-400 text-[11px]">Método de Pago:</span>
                    <span className="font-semibold text-stone-800">{createdOrder.paymentMethod}</span>
                  </div>
                </div>

                <div>
                  <span className="block text-stone-400 text-[11px]">Dirección de Envío:</span>
                  <span className="font-medium text-stone-800">
                    {createdOrder.shippingAddress.street}, {createdOrder.shippingAddress.city}
                  </span>
                </div>

                {/* Items preview */}
                <div className="pt-2 border-t border-stone-200">
                  <span className="block text-stone-400 text-[11px] mb-1">Productos adquiridos:</span>
                  <div className="space-y-1">
                    {createdOrder.items.map((it) => (
                      <div key={it.productId} className="flex justify-between items-center text-stone-700">
                        <span className="truncate max-w-[280px]">
                          {it.quantity}x {it.title}
                        </span>
                        <span className="font-mono font-semibold">
                          ${(it.price * it.quantity).toFixed(2)}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="pt-2 border-t border-stone-200 flex justify-between font-bold text-stone-900 text-sm">
                  <span>Monto Total Cobrado:</span>
                  <span className="text-emerald-800">${createdOrder.total.toFixed(2)}</span>
                </div>
              </div>

              {/* Close / Explore button */}
              <div className="flex justify-center pt-2">
                <button
                  type="button"
                  onClick={closeCheckout}
                  className="px-6 py-2.5 bg-stone-900 hover:bg-stone-800 text-white rounded-xl text-xs font-bold transition shadow-sm"
                >
                  Regresar a la Tienda
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
