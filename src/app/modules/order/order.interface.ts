import { Document, Types } from 'mongoose';

export enum OrderStatus {
  PENDING = 'Pending',
  CONFIRMED = 'Confirmed',
  PREPARING_FOR_SHIPMENT = 'Preparing for Shipment',
  OUT_FOR_DELIVERY = 'Out for Delivery',
  DELIVERED = 'Delivered',
  CANCELLED = 'Cancelled'
}

export enum PaymentStatus {
  PENDING = 'pending',
  COMPLETED = 'completed',
  FAILED = 'failed',
  REFUNDED = 'refunded'
}

export interface IOrderProduct {
  productId: Types.ObjectId;
  quantity: number;
  price: number;
  total: number;
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

// NEW: Payment history interface
export interface IPaymentHistory {
  paymentGateway: string; // e.g., 'Mastercard AFS'
  gatewayTransactionId: string; // Transaction ID from payment gateway
  sessionId?: string; // Payment session ID
  resultIndicator?: string; // Payment result indicator
  successIndicator?: string; // Success indicator for verification
  amount: number;
  currency: string;
  paymentStatus: PaymentStatus;
  paymentMethod?: string; // e.g., 'Credit Card', 'Debit Card'
  cardType?: string; // e.g., 'Visa', 'Mastercard'
  lastFourDigits?: string; // Last 4 digits of card
  paymentDate: Date;
  gatewayResponse?: any; // Full gateway response (optional)
  refundDetails?: {
    refundedAmount: number;
    refundDate: Date;
    refundTransactionId: string;
    reason?: string;
  };
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
  promoCode: string | null;
  estimatedDeliveryDate: Date | null;
  actualDeliveryDate: Date | null;
  status: OrderStatus;
  paymentStatus: PaymentStatus;
  shippingMethodId: Types.ObjectId;
  transactionId?: string;
  orderNotes: string | null;
  trackingNumber: string | null;
  statusHistory: Array<{
    status: OrderStatus;
    timestamp: Date;
    note?: string;
  }>;
  paymentHistory: IPaymentHistory[]; // NEW: Payment history array
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
  }>;
  shippingMethodId: string;
  transactionId: string;
  totalPrice: number;
  shippingFee: number;
  discount?: number;
  tax: number;
  promoCode?: string;
  estimatedDeliveryDate?: Date;
  orderNotes?: string;
}

export interface IUpdateOrderStatus {
  status: OrderStatus;
  note?: string;
  trackingNumber?: string;
}

// NEW: Interface for updating payment with history
export interface IUpdatePaymentWithHistory {
  paymentStatus: PaymentStatus;
  paymentHistory: {
    paymentGateway: string;
    gatewayTransactionId: string;
    sessionId?: string;
    resultIndicator?: string;
    successIndicator?: string;
    amount: number;
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
}

export interface IUserOrderStats {
  totalOrders: number;
  totalSpent: number;
  pendingOrders: number;
  completedOrders: number;
}