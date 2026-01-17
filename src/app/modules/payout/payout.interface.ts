import { Document, Types } from 'mongoose';

export enum PayoutStatus {
  PENDING = 'PENDING',
  APPROVED = 'APPROVED',
  PROCESSING = 'PROCESSING',
  COMPLETED = 'COMPLETED',
  REJECTED = 'REJECTED',
  FAILED = 'FAILED'
}

export enum PayoutMethod {
  BANK_TRANSFER = 'BANK_TRANSFER',
  PAYPAL = 'PAYPAL',
  STRIPE = 'STRIPE'
}

export interface IBankDetails {
  accountHolderName: string;
  accountNumber: string;
  bankName: string;
  bankCode?: string;
  routingNumber?: string;
  swiftCode?: string;
  iban?: string;
}

export interface IPayoutRequest extends Document {
  vendorId: Types.ObjectId;
  requestedAmount: number;
  currency: string;
  payoutMethod: PayoutMethod;
  bankDetails?: IBankDetails;
  paypalEmail?: string;
  stripeAccountId?: string;
  status: PayoutStatus;
  requestedDate: Date;
  processedDate?: Date;
  completedDate?: Date;
  rejectionReason?: string;
  processedBy?: Types.ObjectId;
  transactionReference?: string;
  notes?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface IVendorEarning extends Document {
  vendorId: Types.ObjectId;
  orderId: Types.ObjectId;
  orderNumber: string;
  orderAmount: number;
  vendorShare: number;
  platformCommission: number;
  currency: string;
  earnedDate: Date;
  payoutStatus: 'PENDING' | 'PAID';
  payoutId?: Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

// NEW: Currency Balance Interface
export interface ICurrencyBalance {
  currency: string;
  availableBalance: number;
  pendingBalance: number;
  totalEarned: number;
  totalWithdrawn: number;
}

export interface IVendorWallet extends Document {
  vendorId: Types.ObjectId;
  // CHANGED: Now stores array of currency balances
  currencyBalances: ICurrencyBalance[];
  lastPayoutDate?: Date;
  createdAt: Date;
  updatedAt: Date;
}

export interface ICreatePayoutRequest {
  requestedAmount: number;
  currency: string; // NEW: Required currency field
  payoutMethod: PayoutMethod;
  bankDetails?: IBankDetails;
  paypalEmail?: string;
  stripeAccountId?: string;
  notes?: string;
}

export interface IProcessPayoutRequest {
  status: PayoutStatus;
  rejectionReason?: string;
  transactionReference?: string;
  notes?: string;
}

export interface IVendorSalesStats {
  totalSales: number;
  totalOrders: number;
  vendorEarnings: number;
  platformCommission: number;
  averageOrderValue: number;
  pendingEarnings: number;
  paidEarnings: number;
  currency: string; // NEW: Stats per currency
}

export interface IMonthlySales {
  month: string;
  year: number;
  totalSales: number;
  totalOrders: number;
  vendorEarnings: number;
  platformCommission: number;
  currency: string; // NEW
}

export interface IAdminCommissionStats {
  totalCommission: number;
  totalVendorEarnings: number;
  totalOrders: number;
  averageCommissionPerOrder: number;
  currency: string; // NEW
  monthlyBreakdown: Array<{
    month: string;
    year: number;
    commission: number;
    vendorEarnings: number;
  }>;
}

export interface IPayoutFilters {
  vendorId?: string;
  status?: PayoutStatus;
  currency?: string; // NEW
  startDate?: Date;
  endDate?: Date;
  minAmount?: number;
  maxAmount?: number;
}

export interface ISalesReportFilters {
  vendorId?: string;
  currency?: string; // NEW
  startDate?: Date;
  endDate?: Date;
  year?: number;
  month?: number;
}