// ============================================================
// FILE: payout.service.ts - COMPLETE FIXED VERSION
// ============================================================

import mongoose from 'mongoose';
import { PayoutRequestModel, VendorEarningModel, VendorWalletModel } from './payout.model';
import {
  IPayoutRequest,
  IVendorEarning,
  IVendorWallet,
  ICreatePayoutRequest,
  IProcessPayoutRequest,
  IVendorSalesStats,
  IMonthlySales,
  IAdminCommissionStats,
  IPayoutFilters,
  ISalesReportFilters,
  PayoutStatus
} from './payout.interface';
import { walletService } from '../wallet/wallet.service';

export class PayoutService {
  /**
   * Create vendor earnings when order is delivered
   */
  async createVendorEarning(
    vendorId: string,
    orderId: string,
    orderNumber: string,
    orderAmount: number,
    currency: string = 'BHD'
  ): Promise<IVendorEarning> {
    const session = await mongoose.startSession();
    session.startTransaction();

    try {
      console.log(`📊 Creating vendor earning - Vendor: ${vendorId}, Order: ${orderNumber}, Amount: ${orderAmount} ${currency}`);

      // Check if earning already exists
      const existingEarning = await VendorEarningModel.findOne({ 
        orderId: new mongoose.Types.ObjectId(orderId),
        vendorId: new mongoose.Types.ObjectId(vendorId)
      }).session(session);
      
      if (existingEarning) {
        await session.abortTransaction();
        console.log(`⚠️ Earning already exists for vendor ${vendorId} and order ${orderNumber}`);
        return existingEarning;
      }

      // Calculate vendor share (90%) and platform commission (10%)
      const vendorShare = Math.round(orderAmount * 0.9 * 1000) / 1000;
      const platformCommission = Math.round(orderAmount * 0.1 * 1000) / 1000;

      console.log(`💰 Calculated - Vendor Share: ${vendorShare} ${currency} (90%), Platform Commission: ${platformCommission} ${currency} (10%)`);

      // Create earning record with currency
      const earning = new VendorEarningModel({
        vendorId: new mongoose.Types.ObjectId(vendorId),
        orderId: new mongoose.Types.ObjectId(orderId),
        orderNumber,
        orderAmount,
        vendorShare,
        platformCommission,
        currency: currency.toUpperCase(),
        earnedDate: new Date(),
        payoutStatus: 'PENDING'
      });

      await earning.save({ session });
      console.log(`✅ Earning record created`);

      // Get or create vendor wallet
      let wallet = await VendorWalletModel.findOne({ 
        vendorId: new mongoose.Types.ObjectId(vendorId) 
      }).session(session);

      if (!wallet) {
        console.log(`🆕 Creating new vendor wallet for vendor ${vendorId}`);
        wallet = new VendorWalletModel({
          vendorId: new mongoose.Types.ObjectId(vendorId),
          currencyBalances: [{
            currency: currency.toUpperCase(),
            availableBalance: vendorShare,
            pendingBalance: 0,
            totalEarned: vendorShare,
            totalWithdrawn: 0
          }]
        });
      } else {
        // Update currency balance
        const currBalance = wallet.currencyBalances.find(cb => cb.currency === currency.toUpperCase());
        
        if (currBalance) {
          console.log(`🔄 Updating existing ${currency} balance. Current: ${currBalance.availableBalance}`);
          currBalance.availableBalance = Math.round((currBalance.availableBalance + vendorShare) * 1000) / 1000;
          currBalance.totalEarned = Math.round((currBalance.totalEarned + vendorShare) * 1000) / 1000;
        } else {
          console.log(`🆕 Adding new currency ${currency} to wallet`);
          wallet.currencyBalances.push({
            currency: currency.toUpperCase(),
            availableBalance: vendorShare,
            pendingBalance: 0,
            totalEarned: vendorShare,
            totalWithdrawn: 0
          });
        }
      }

      await wallet.save({ session });
      await session.commitTransaction();
      
      const balance = wallet.currencyBalances.find(cb => cb.currency === currency.toUpperCase());
      console.log(`✅ Vendor earning created successfully. New ${currency} balance: ${balance?.availableBalance}`);
      
      return earning;
    } catch (error) {
      await session.abortTransaction();
      console.error('❌ Error creating vendor earning:', error);
      throw error;
    } finally {
      session.endSession();
    }
  }

  /**
   * Create admin commission record when order is delivered
   */
  async createAdminCommission(
    orderId: string,
    orderNumber: string,
    orderAmount: number,
    currency: string = 'BHD'
  ): Promise<void> {
    try {
      const adminUserId = process.env.ADMIN_USER_ID;
      const platformCommission = Math.round(orderAmount * 0.1 * 1000) / 1000;

      console.log(`💼 Creating admin commission - Order: ${orderNumber}, Total: ${orderAmount} ${currency}, Commission: ${platformCommission} ${currency}`);

      if (adminUserId) {
        try {
          await walletService.creditWallet(adminUserId, {
            amount: platformCommission,
            paymentMethod: 'MASTERCARD_GATEWAY' as any,
            description: `Platform commission (10%) from order ${orderNumber}`
          });
          
          console.log(`✅ Admin commission ${platformCommission} ${currency} credited for order ${orderNumber}`);
        } catch (walletError) {
          console.error('❌ Error crediting admin wallet:', walletError);
        }
      } else {
        console.warn('⚠️ ADMIN_USER_ID not configured in environment - commission tracked but not credited to wallet');
      }
    } catch (error) {
      console.error('❌ Error creating admin commission:', error);
    }
  }

  /**
   * Get or create vendor wallet
   */
  async getOrCreateVendorWallet(vendorId: string): Promise<IVendorWallet> {
    try {
      console.log(`🔍 Getting or creating wallet for vendor: ${vendorId}`);

      let wallet = await VendorWalletModel.findOne({ 
        vendorId: new mongoose.Types.ObjectId(vendorId) 
      }).populate('vendorId', 'name email businessName phone');

      if (!wallet) {
        console.log(`🆕 Wallet not found, creating new wallet for vendor: ${vendorId}`);
        
        wallet = new VendorWalletModel({
          vendorId: new mongoose.Types.ObjectId(vendorId),
          currencyBalances: [] // Start with empty array
        });
        
        await wallet.save();
        console.log(`✅ New wallet created for vendor: ${vendorId}`);
        
        // Populate after save
        wallet = await VendorWalletModel.findById(wallet._id)
          .populate('vendorId', 'name email businessName phone');
      } else {
        console.log(`✅ Wallet found with ${wallet.currencyBalances.length} currency balances`);
      }

      return wallet!;
    } catch (error) {
      console.error('❌ Error getting/creating vendor wallet:', error);
      throw error;
    }
  }

  /**
   * Create payout request by vendor
   */
  async createPayoutRequest(
    vendorId: string,
    data: ICreatePayoutRequest
  ): Promise<IPayoutRequest> {
    const session = await mongoose.startSession();
    session.startTransaction();

    try {
      const currency = data.currency.toUpperCase();
      console.log(`💰 Creating payout request for vendor: ${vendorId}, Amount: ${data.requestedAmount} ${currency}`);

      // Get vendor wallet
      const wallet = await VendorWalletModel.findOne({ 
        vendorId: new mongoose.Types.ObjectId(vendorId) 
      }).session(session);

      if (!wallet) {
        throw new Error('Vendor wallet not found. Please contact support.');
      }

      // Find currency balance
      const currBalance = wallet.currencyBalances.find(cb => cb.currency === currency);
      
      if (!currBalance) {
        throw new Error(`No ${currency} balance found in your wallet.`);
      }

      console.log(`📊 ${currency} Wallet status - Available: ${currBalance.availableBalance}, Requested: ${data.requestedAmount}`);

      // Check if sufficient balance
      if (currBalance.availableBalance < data.requestedAmount) {
        throw new Error(`Insufficient ${currency} balance for payout. Available: ${currBalance.availableBalance.toFixed(3)}, Requested: ${data.requestedAmount.toFixed(3)}`);
      }

      // Check for pending payout requests in same currency
      const pendingRequest = await PayoutRequestModel.findOne({
        vendorId: new mongoose.Types.ObjectId(vendorId),
        currency: currency,
        status: { $in: [PayoutStatus.PENDING, PayoutStatus.APPROVED, PayoutStatus.PROCESSING] }
      }).session(session);

      if (pendingRequest) {
        throw new Error(`You already have a pending ${currency} payout request. Please wait for it to be processed.`);
      }

      // Create payout request
      const payoutRequest = new PayoutRequestModel({
        vendorId: new mongoose.Types.ObjectId(vendorId),
        requestedAmount: data.requestedAmount,
        currency: currency,
        payoutMethod: data.payoutMethod,
        bankDetails: data.bankDetails,
        paypalEmail: data.paypalEmail,
        stripeAccountId: data.stripeAccountId,
        status: PayoutStatus.PENDING,
        requestedDate: new Date(),
        notes: data.notes
      });

      await payoutRequest.save({ session });
      console.log(`✅ Payout request created: ${payoutRequest._id}`);

      // Move amount from available to pending
      currBalance.availableBalance = Math.round((currBalance.availableBalance - data.requestedAmount) * 1000) / 1000;
      currBalance.pendingBalance = Math.round((currBalance.pendingBalance + data.requestedAmount) * 1000) / 1000;
      await wallet.save({ session });

      console.log(`✅ Wallet updated - New Available: ${currBalance.availableBalance} ${currency}, New Pending: ${currBalance.pendingBalance} ${currency}`);

      await session.commitTransaction();

      // Populate before returning
      await payoutRequest.populate('vendorId', 'name email businessName phone');

      return payoutRequest;
    } catch (error) {
      await session.abortTransaction();
      console.error('❌ Error creating payout request:', error);
      throw error;
    } finally {
      session.endSession();
    }
  }

  /**
   * Process payout request by admin
   */
  async processPayoutRequest(
    payoutId: string,
    adminId: string,
    data: IProcessPayoutRequest
  ): Promise<IPayoutRequest> {
    const session = await mongoose.startSession();
    session.startTransaction();

    try {
      console.log(`⚙️ Processing payout request: ${payoutId}, New Status: ${data.status}`);

      const payout = await PayoutRequestModel.findById(payoutId)
        .populate('vendorId', 'name email businessName')
        .session(session);

      if (!payout) {
        throw new Error('Payout request not found');
      }

      if (payout.status !== PayoutStatus.PENDING && payout.status !== PayoutStatus.APPROVED) {
        throw new Error(`Payout request cannot be processed. Current status: ${payout.status}`);
      }

      const wallet = await VendorWalletModel.findOne({ 
        vendorId: payout.vendorId 
      }).session(session);

      if (!wallet) {
        throw new Error('Vendor wallet not found');
      }

      // Find the currency balance for this payout
      const currBalance = wallet.currencyBalances.find(cb => cb.currency === payout.currency);

      if (!currBalance) {
        throw new Error(`${payout.currency} balance not found in wallet`);
      }

      console.log(`📊 Current ${payout.currency} wallet - Pending: ${currBalance.pendingBalance}, Payout Amount: ${payout.requestedAmount}`);

      // Update payout request
      payout.status = data.status;
      payout.processedBy = new mongoose.Types.ObjectId(adminId);
      payout.processedDate = new Date();
      payout.transactionReference = data.transactionReference;
      payout.rejectionReason = data.rejectionReason;
      payout.notes = data.notes || payout.notes;

      if (data.status === PayoutStatus.COMPLETED) {
        payout.completedDate = new Date();
        
        // Update currency balance
        currBalance.pendingBalance = Math.round((currBalance.pendingBalance - payout.requestedAmount) * 1000) / 1000;
        currBalance.totalWithdrawn = Math.round((currBalance.totalWithdrawn + payout.requestedAmount) * 1000) / 1000;
        wallet.lastPayoutDate = new Date();

        console.log(`✅ Payout completed - New Pending: ${currBalance.pendingBalance} ${payout.currency}, Total Withdrawn: ${currBalance.totalWithdrawn} ${payout.currency}`);

        // Mark earnings as paid (up to the payout amount) - only for same currency
        const pendingEarnings = await VendorEarningModel.find({
          vendorId: payout.vendorId,
          currency: payout.currency,
          payoutStatus: 'PENDING'
        })
        .sort({ earnedDate: 1 })
        .session(session);

        let remainingAmount = payout.requestedAmount;
        const earningIdsToUpdate = [];

        for (const earning of pendingEarnings) {
          if (remainingAmount <= 0) break;
          
          if (earning.vendorShare <= remainingAmount) {
            earningIdsToUpdate.push(earning._id);
            remainingAmount -= earning.vendorShare;
          }
        }

        if (earningIdsToUpdate.length > 0) {
          await VendorEarningModel.updateMany(
            { _id: { $in: earningIdsToUpdate } },
            {
              $set: {
                payoutStatus: 'PAID',
                payoutId: payout._id
              }
            },
            { session }
          );
          console.log(`✅ Marked ${earningIdsToUpdate.length} ${payout.currency} earnings as PAID`);
        }

      } else if (data.status === PayoutStatus.REJECTED || data.status === PayoutStatus.FAILED) {
        // Return amount to available balance
        currBalance.availableBalance = Math.round((currBalance.availableBalance + payout.requestedAmount) * 1000) / 1000;
        currBalance.pendingBalance = Math.round((currBalance.pendingBalance - payout.requestedAmount) * 1000) / 1000;
        
        console.log(`🔄 Payout ${data.status} - Amount returned to available balance: ${currBalance.availableBalance} ${payout.currency}`);
      }

      await payout.save({ session });
      await wallet.save({ session });

      await session.commitTransaction();

      console.log(`✅ Payout request processed successfully`);

      return payout;
    } catch (error) {
      await session.abortTransaction();
      console.error('❌ Error processing payout request:', error);
      throw error;
    } finally {
      session.endSession();
    }
  }

  /**
   * Get vendor sales statistics (returns array grouped by currency)
   */
  async getVendorSalesStats(
    vendorId: string,
    filters?: ISalesReportFilters
  ): Promise<IVendorSalesStats[]> {
    try {
      console.log(`📊 Getting sales stats for vendor: ${vendorId}`);

      const query: any = { vendorId: new mongoose.Types.ObjectId(vendorId) };

      if (filters?.currency) {
        query.currency = filters.currency.toUpperCase();
      }

      if (filters?.startDate || filters?.endDate) {
        query.earnedDate = {};
        if (filters.startDate) query.earnedDate.$gte = filters.startDate;
        if (filters.endDate) query.earnedDate.$lte = filters.endDate;
      }

      // Group by currency
      const statsPerCurrency = await VendorEarningModel.aggregate([
        { $match: query },
        {
          $group: {
            _id: '$currency',
            totalSales: { $sum: '$orderAmount' },
            totalOrders: { $sum: 1 },
            vendorEarnings: { $sum: '$vendorShare' },
            platformCommission: { $sum: '$platformCommission' },
            pendingEarnings: {
              $sum: {
                $cond: [{ $eq: ['$payoutStatus', 'PENDING'] }, '$vendorShare', 0]
              }
            },
            paidEarnings: {
              $sum: {
                $cond: [{ $eq: ['$payoutStatus', 'PAID'] }, '$vendorShare', 0]
              }
            }
          }
        }
      ]);

      console.log(`📈 Found stats for ${statsPerCurrency.length} currencies`);

      return statsPerCurrency.map(stat => ({
        currency: stat._id,
        totalSales: Math.round(stat.totalSales * 1000) / 1000,
        totalOrders: stat.totalOrders,
        vendorEarnings: Math.round(stat.vendorEarnings * 1000) / 1000,
        platformCommission: Math.round(stat.platformCommission * 1000) / 1000,
        averageOrderValue: stat.totalOrders > 0 ? Math.round((stat.totalSales / stat.totalOrders) * 1000) / 1000 : 0,
        pendingEarnings: Math.round(stat.pendingEarnings * 1000) / 1000,
        paidEarnings: Math.round(stat.paidEarnings * 1000) / 1000
      }));
    } catch (error) {
      console.error('❌ Error getting vendor sales stats:', error);
      throw error;
    }
  }

  /**
   * Get vendor monthly sales breakdown (grouped by currency)
   */
  async getVendorMonthlySales(vendorId: string, year?: number, currency?: string): Promise<IMonthlySales[]> {
    try {
      const currentYear = year || new Date().getFullYear();
      console.log(`📅 Getting monthly sales for vendor: ${vendorId}, Year: ${currentYear}`);

      const startDate = new Date(currentYear, 0, 1);
      const endDate = new Date(currentYear, 11, 31, 23, 59, 59);

      const matchQuery: any = {
        vendorId: new mongoose.Types.ObjectId(vendorId),
        earnedDate: { $gte: startDate, $lte: endDate }
      };

      if (currency) {
        matchQuery.currency = currency.toUpperCase();
      }

      const earnings = await VendorEarningModel.aggregate([
        { $match: matchQuery },
        {
          $group: {
            _id: {
              year: { $year: '$earnedDate' },
              month: { $month: '$earnedDate' },
              currency: '$currency'
            },
            totalSales: { $sum: '$orderAmount' },
            totalOrders: { $sum: 1 },
            vendorEarnings: { $sum: '$vendorShare' },
            platformCommission: { $sum: '$platformCommission' }
          }
        },
        {
          $sort: { '_id.year': 1, '_id.month': 1, '_id.currency': 1 }
        }
      ]);

      console.log(`📊 Found ${earnings.length} month-currency combinations with sales`);

      const monthNames = [
        'January', 'February', 'March', 'April', 'May', 'June',
        'July', 'August', 'September', 'October', 'November', 'December'
      ];

      return earnings.map(e => ({
        month: monthNames[e._id.month - 1],
        year: e._id.year,
        currency: e._id.currency,
        totalSales: Math.round(e.totalSales * 1000) / 1000,
        totalOrders: e.totalOrders,
        vendorEarnings: Math.round(e.vendorEarnings * 1000) / 1000,
        platformCommission: Math.round(e.platformCommission * 1000) / 1000
      }));
    } catch (error) {
      console.error('❌ Error getting vendor monthly sales:', error);
      throw error;
    }
  }

  /**
   * Get admin commission statistics (grouped by currency if needed)
   */
  async getAdminCommissionStats(filters?: ISalesReportFilters): Promise<IAdminCommissionStats[]> {
    try {
      console.log(`💼 Getting admin commission stats`);

      const query: any = {};

      if (filters?.currency) {
        query.currency = filters.currency.toUpperCase();
      }

      if (filters?.startDate || filters?.endDate) {
        query.earnedDate = {};
        if (filters.startDate) query.earnedDate.$gte = filters.startDate;
        if (filters.endDate) query.earnedDate.$lte = filters.endDate;
      }

      // Group by currency
      const statsByCurrency = await VendorEarningModel.aggregate([
        { $match: query },
        {
          $group: {
            _id: '$currency',
            totalCommission: { $sum: '$platformCommission' },
            totalVendorEarnings: { $sum: '$vendorShare' },
            totalOrders: { $sum: 1 }
          }
        }
      ]);

      const result: IAdminCommissionStats[] = [];

      for (const currencyStat of statsByCurrency) {
        // Get monthly breakdown for this currency
        const monthlyData = await VendorEarningModel.aggregate([
          { 
            $match: { 
              ...query, 
              currency: currencyStat._id 
            } 
          },
          {
            $group: {
              _id: {
                year: { $year: '$earnedDate' },
                month: { $month: '$earnedDate' }
              },
              commission: { $sum: '$platformCommission' },
              vendorEarnings: { $sum: '$vendorShare' }
            }
          },
          {
            $sort: { '_id.year': -1, '_id.month': -1 }
          },
          {
            $limit: 12
          }
        ]);

        const monthNames = [
          'January', 'February', 'March', 'April', 'May', 'June',
          'July', 'August', 'September', 'October', 'November', 'December'
        ];

        const monthlyBreakdown = monthlyData.map(m => ({
          month: monthNames[m._id.month - 1],
          year: m._id.year,
          commission: Math.round(m.commission * 1000) / 1000,
          vendorEarnings: Math.round(m.vendorEarnings * 1000) / 1000
        }));

        result.push({
          currency: currencyStat._id,
          totalCommission: Math.round(currencyStat.totalCommission * 1000) / 1000,
          totalVendorEarnings: Math.round(currencyStat.totalVendorEarnings * 1000) / 1000,
          totalOrders: currencyStat.totalOrders,
          averageCommissionPerOrder: currencyStat.totalOrders > 0 
            ? Math.round((currencyStat.totalCommission / currencyStat.totalOrders) * 1000) / 1000 
            : 0,
          monthlyBreakdown
        });
      }

      console.log(`✅ Commission stats calculated for ${result.length} currencies`);

      return result;
    } catch (error) {
      console.error('❌ Error getting admin commission stats:', error);
      throw error;
    }
  }

  /**
   * Get all payout requests with filters
   */
  async getAllPayoutRequests(filters?: IPayoutFilters): Promise<IPayoutRequest[]> {
    try {
      console.log(`🔍 Getting all payout requests with filters:`, filters);

      const query: any = {};

      if (filters?.vendorId) {
        query.vendorId = new mongoose.Types.ObjectId(filters.vendorId);
      }

      if (filters?.status) {
        query.status = filters.status;
      }

      if (filters?.currency) {
        query.currency = filters.currency.toUpperCase();
      }

      if (filters?.startDate || filters?.endDate) {
        query.requestedDate = {};
        if (filters.startDate) query.requestedDate.$gte = filters.startDate;
        if (filters.endDate) query.requestedDate.$lte = filters.endDate;
      }

      if (filters?.minAmount || filters?.maxAmount) {
        query.requestedAmount = {};
        if (filters.minAmount) query.requestedAmount.$gte = filters.minAmount;
        if (filters.maxAmount) query.requestedAmount.$lte = filters.maxAmount;
      }

      const requests = await PayoutRequestModel.find(query)
        .populate('vendorId', 'name email businessName phone')
        .populate('processedBy', 'name email')
        .sort({ requestedDate: -1 });

      console.log(`✅ Found ${requests.length} payout requests`);

      return requests;
    } catch (error) {
      console.error('❌ Error getting all payout requests:', error);
      throw error;
    }
  }

  /**
   * Get vendor payout requests
   */
  async getVendorPayoutRequests(vendorId: string): Promise<IPayoutRequest[]> {
    try {
      console.log(`🔍 Getting payout requests for vendor: ${vendorId}`);

      const requests = await PayoutRequestModel.find({ 
        vendorId: new mongoose.Types.ObjectId(vendorId) 
      })
        .populate('processedBy', 'name email')
        .sort({ requestedDate: -1 });

      console.log(`✅ Found ${requests.length} payout requests`);

      return requests;
    } catch (error) {
      console.error('❌ Error getting vendor payout requests:', error);
      throw error;
    }
  }

  /**
   * Get payout request by ID
   */
  async getPayoutRequestById(payoutId: string): Promise<IPayoutRequest | null> {
    try {
      console.log(`🔍 Getting payout request by ID: ${payoutId}`);

      const request = await PayoutRequestModel.findById(payoutId)
        .populate('vendorId', 'name email businessName phone address')
        .populate('processedBy', 'name email');

      if (request) {
        console.log(`✅ Payout request found`);
      } else {
        console.log(`⚠️ Payout request not found`);
      }

      return request;
    } catch (error) {
      console.error('❌ Error getting payout request:', error);
      throw error;
    }
  }

  /**
   * Get vendor wallet
   */
  async getVendorWallet(vendorId: string): Promise<IVendorWallet | null> {
    try {
      console.log(`🔍 Getting vendor wallet: ${vendorId}`);

      const wallet = await VendorWalletModel.findOne({ 
        vendorId: new mongoose.Types.ObjectId(vendorId) 
      }).populate('vendorId', 'name email businessName phone');

      if (wallet) {
        console.log(`✅ Wallet found with ${wallet.currencyBalances.length} currency balances`);
      } else {
        console.log(`⚠️ Wallet not found`);
      }

      return wallet;
    } catch (error) {
      console.error('❌ Error getting vendor wallet:', error);
      throw error;
    }
  }

  /**
   * Get all vendor wallets (Admin)
   */
  async getAllVendorWallets(limit: number = 50, offset: number = 0): Promise<IVendorWallet[]> {
    try {
      console.log(`🔍 Getting all vendor wallets - Limit: ${limit}, Offset: ${offset}`);

      const wallets = await VendorWalletModel.find()
        .populate('vendorId', 'name email businessName phone')
        .limit(limit)
        .skip(offset);

      console.log(`✅ Found ${wallets.length} vendor wallets`);

      return wallets;
    } catch (error) {
      console.error('❌ Error getting all vendor wallets:', error);
      throw error;
    }
  }

  /**
   * Get vendor earnings history
   */
  async getVendorEarnings(
    vendorId: string,
    filters?: ISalesReportFilters
  ): Promise<IVendorEarning[]> {
    try {
      console.log(`🔍 Getting vendor earnings: ${vendorId}`);

      const query: any = { vendorId: new mongoose.Types.ObjectId(vendorId) };

      if (filters?.currency) {
        query.currency = filters.currency.toUpperCase();
      }

      if (filters?.startDate || filters?.endDate) {
        query.earnedDate = {};
        if (filters.startDate) query.earnedDate.$gte = filters.startDate;
        if (filters.endDate) query.earnedDate.$lte = filters.endDate;
      }

      const earnings = await VendorEarningModel.find(query)
        .populate('orderId')
        .sort({ earnedDate: -1 });

      console.log(`✅ Found ${earnings.length} earnings records`);

      return earnings;
    } catch (error) {
      console.error('❌ Error getting vendor earnings:', error);
      throw error;
    }
  }
}

export const payoutService = new PayoutService();