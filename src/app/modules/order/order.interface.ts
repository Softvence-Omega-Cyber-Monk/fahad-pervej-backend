import { Document, Types } from 'mongoose';

export enum OrderStatus {
  PENDING = 'PENDING',
  CONFIRMED = 'CONFIRMED',
  PREPARING_FOR_SHIPMENT = 'PREPARING_FOR_SHIPMENT',
  OUT_FOR_DELIVERY = 'OUT_FOR_DELIVERY',
  DELIVERED = 'DELIVERED',
  CANCELLED = 'CANCELLED'
}

export enum PaymentStatus {
  PENDING = 'PENDING',
  COMPLETED = 'COMPLETED',
  FAILED = 'FAILED',
  REFUNDED = 'REFUNDED'
}

export enum PaymentMethodType {
  WALLET = 'WALLET',
  GATEWAY = 'GATEWAY',
  CASH_ON_DELIVERY = 'CASH_ON_DELIVERY'
}

export interface IOrderProduct {
  productId: Types.ObjectId;
  quantity: number;
  price: number;
  total: number;
  currency: string; // NEW: Currency for this product
}

export interface IShippingAddress {
  fullName: string;
  mobileNumber: string;
  country: string;
  addressSpecific: string;
  city: string;
  state: string;
  zipCode: string;
}

export interface IPaymentHistory {
  paymentGateway: string;
  gatewayTransactionId: string;
  sessionId?: string;
  resultIndicator?: string;
  successIndicator?: string;
  currency: string;
  paymentStatus: PaymentStatus;
  paymentMethod?: string;
  cardType?: string;
  lastFourDigits?: string;
  paymentDate: Date;
  gatewayResponse?: any;
  refundDetails?: {
    refundedAmount: number;
    refundDate: Date;
    refundTransactionId: string;
    reason?: string;
  };
}

// NEW: Currency breakdown for multi-currency orders
export interface ICurrencyBreakdown {
  currency: string;
  subtotal: number;
  shippingFee: number;
  tax: number;
  discount: number;
  total: number;
}

export interface IOrder extends Document {
  userId: Types.ObjectId;
  orderNumber: string;
  shippingAddress: IShippingAddress;
  products: IOrderProduct[];
  totalPrice: number;
  shippingFee: number;
  discount: number;
  tax: number;
  grandTotal: number;
  baseCurrency: string; // NEW: Base currency for the order (e.g., 'BHD')
  currencyBreakdown: ICurrencyBreakdown[]; // NEW: Breakdown by currency
  promoCode: string | null;
  estimatedDeliveryDate: Date | null;
  actualDeliveryDate: Date | null;
  status: OrderStatus;
  paymentStatus: PaymentStatus;
  paymentMethodUsed?: PaymentMethodType;
  shippingMethodId: Types.ObjectId;
  shippingProvider?: string; // NEW: Shipping provider name (e.g., 'aramex', 'dhl')
  shippingProviderId?: string; // NEW: External provider ID
  transactionId?: string;
  orderNotes: string | null;
  trackingNumber: string | null;
  statusHistory: Array<{
    status: OrderStatus;
    timestamp: Date;
    note?: string;
  }>;
  paymentHistory: IPaymentHistory[];
  createdAt: Date;
  updatedAt: Date;
}

export interface ICreateOrder {
  fullName: string;
  mobileNumber: string;
  country: string;
  addressSpecific: string;
  city: string;
  state: string;
  zipCode: string;
  products: Array<{
    productId: string;
    quantity: number;
    currency?: string; // NEW: Currency for each product
  }>;
  shippingMethodId: string;
  shippingProvider?: string; // NEW: Shipping provider name
  shippingProviderId?: string; // NEW: External provider ID
  transactionId: string;
  totalPrice: number;
  shippingFee: number;
  discount?: number;
  tax: number;
  baseCurrency?: string; // NEW: Base currency for the order
  promoCode?: string;
  estimatedDeliveryDate?: Date;
  orderNotes?: string;
  paymentMethod?: PaymentMethodType;
}

export interface IUpdateOrderStatus {
  status: OrderStatus;
  note?: string;
  trackingNumber?: string;
}

export interface IUpdatePaymentWithHistory {
  paymentStatus: PaymentStatus;
  paymentHistory: {
    paymentGateway: string;
    gatewayTransactionId: string;
    sessionId?: string;
    resultIndicator?: string;
    successIndicator?: string;
    currency: string;
    paymentMethod?: string;
    cardType?: string;
    lastFourDigits?: string;
    gatewayResponse?: any;
  };
}

export interface IOrderFilters {
  userId?: string;
  status?: OrderStatus;
  paymentStatus?: PaymentStatus;
  startDate?: Date;
  endDate?: Date;
  orderNumber?: string;
}

export interface IOrderStats {
  totalOrders: number;
  pending: number;
  confirmed: number;
  preparingForShipment: number;
  outForDelivery: number;
  delivered: number;
  cancelled: number;
  totalRevenue: number;
  averageOrderValue: number;
  revenueByCurrency?: { [key: string]: number }; // NEW: Revenue breakdown by currency
}

export interface IUserOrderStats {
  totalOrders: number;
  totalSpent: number;
  pendingOrders: number;
  completedOrders: number;
}