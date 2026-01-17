import mongoose, { Schema } from 'mongoose';
import { 
  IPayoutRequest, 
  IVendorEarning, 
  IVendorWallet, 
  PayoutStatus, 
  PayoutMethod 
} from './payout.interface';

// Currency Balance Sub-Schema
const currencyBalanceSchema = new Schema({
  currency: {
    type: String,
    required: true,
    uppercase: true
  },
  availableBalance: {
    type: Number,
    required: true,
    default: 0,
    min: [0, 'Available balance cannot be negative']
  },
  pendingBalance: {
    type: Number,
    required: true,
    default: 0,
    min: [0, 'Pending balance cannot be negative']
  },
  totalEarned: {
    type: Number,
    required: true,
    default: 0,
    min: [0, 'Total earned cannot be negative']
  },
  totalWithdrawn: {
    type: Number,
    required: true,
    default: 0,
    min: [0, 'Total withdrawn cannot be negative']
  }
}, { _id: false });

// Bank Details Schema
const bankDetailsSchema = new Schema({
  accountHolderName: {
    type: String,
    required: true,
    trim: true
  },
  accountNumber: {
    type: String,
    required: true,
    trim: true
  },
  bankName: {
    type: String,
    required: true,
    trim: true
  },
  bankCode: {
    type: String,
    trim: true
  },
  routingNumber: {
    type: String,
    trim: true
  },
  swiftCode: {
    type: String,
    trim: true
  },
  iban: {
    type: String,
    trim: true
  }
}, { _id: false });

// Payout Request Schema - Added currency index
const payoutRequestSchema = new Schema<IPayoutRequest>(
  {
    vendorId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true
    },
    requestedAmount: {
      type: Number,
      required: true,
      min: [0, 'Amount cannot be negative']
    },
    currency: {
      type: String,
      required: true,
      uppercase: true,
      index: true // NEW INDEX
    },
    payoutMethod: {
      type: String,
      enum: Object.values(PayoutMethod),
      required: true
    },
    bankDetails: {
      type: bankDetailsSchema
    },
    paypalEmail: {
      type: String,
      trim: true,
      lowercase: true
    },
    stripeAccountId: {
      type: String,
      trim: true
    },
    status: {
      type: String,
      enum: Object.values(PayoutStatus),
      default: PayoutStatus.PENDING,
      index: true
    },
    requestedDate: {
      type: Date,
      default: Date.now
    },
    processedDate: {
      type: Date
    },
    completedDate: {
      type: Date
    },
    rejectionReason: {
      type: String,
      trim: true
    },
    processedBy: {
      type: Schema.Types.ObjectId,
      ref: 'User'
    },
    transactionReference: {
      type: String,
      trim: true
    },
    notes: {
      type: String,
      trim: true
    }
  },
  {
    timestamps: true
  }
);

// Indexes
payoutRequestSchema.index({ vendorId: 1, status: 1, currency: 1 }); // UPDATED
payoutRequestSchema.index({ requestedDate: -1 });
payoutRequestSchema.index({ createdAt: -1 });

// Vendor Earning Schema - Already has currency
const vendorEarningSchema = new Schema<IVendorEarning>(
  {
    vendorId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true
    },
    orderId: {
      type: Schema.Types.ObjectId,
      ref: 'Order',
      required: true,
      unique: true
    },
    orderNumber: {
      type: String,
      required: true,
      index: true
    },
    orderAmount: {
      type: Number,
      required: true,
      min: [0, 'Order amount cannot be negative']
    },
    vendorShare: {
      type: Number,
      required: true,
      min: [0, 'Vendor share cannot be negative']
    },
    platformCommission: {
      type: Number,
      required: true,
      min: [0, 'Platform commission cannot be negative']
    },
    currency: {
      type: String,
      required: true,
      uppercase: true,
      index: true
    },
    earnedDate: {
      type: Date,
      default: Date.now,
      index: true
    },
    payoutStatus: {
      type: String,
      enum: ['PENDING', 'PAID'],
      default: 'PENDING',
      index: true
    },
    payoutId: {
      type: Schema.Types.ObjectId,
      ref: 'PayoutRequest'
    }
  },
  {
    timestamps: true
  }
);

// Indexes
vendorEarningSchema.index({ vendorId: 1, payoutStatus: 1, currency: 1 }); // UPDATED
vendorEarningSchema.index({ vendorId: 1, earnedDate: -1 });
vendorEarningSchema.index({ createdAt: -1 });

// Vendor Wallet Schema - MAJOR UPDATE
const vendorWalletSchema = new Schema<IVendorWallet>(
  {
    vendorId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      unique: true,
      index: true
    },
    currencyBalances: {
      type: [currencyBalanceSchema],
      default: []
    },
    lastPayoutDate: {
      type: Date
    }
  },
  {
    timestamps: true
  }
);

// Helper method to get balance for a specific currency
vendorWalletSchema.methods.getCurrencyBalance = function(currency: string) {
  return this.currencyBalances.find((cb: any) => cb.currency === currency.toUpperCase());
};

// Helper method to update or add currency balance
vendorWalletSchema.methods.updateCurrencyBalance = function(currency: string, updates: any) {
  const index = this.currencyBalances.findIndex((cb: any) => cb.currency === currency.toUpperCase());
  
  if (index >= 0) {
    Object.assign(this.currencyBalances[index], updates);
  } else {
    this.currencyBalances.push({
      currency: currency.toUpperCase(),
      availableBalance: 0,
      pendingBalance: 0,
      totalEarned: 0,
      totalWithdrawn: 0,
      ...updates
    });
  }
};

export const PayoutRequestModel = mongoose.model<IPayoutRequest>('PayoutRequest', payoutRequestSchema);
export const VendorEarningModel = mongoose.model<IVendorEarning>('VendorEarning', vendorEarningSchema);
export const VendorWalletModel = mongoose.model<IVendorWallet>('VendorWallet', vendorWalletSchema);