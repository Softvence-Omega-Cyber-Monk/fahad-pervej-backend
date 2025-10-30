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
  transactionId: string;
  orderNotes: string | null;
  trackingNumber: string | null;
  statusHistory: Array<{
    status: OrderStatus;
    timestamp: Date;
    note?: string;
  }>;
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