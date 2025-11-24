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

export class PayoutService {
  /**
   * Create vendor earnings when order is delivered
   * This should be called when order status changes to DELIVERED
   */
  async createVendorEarning(
    vendorId: string,
    orderId: string,
    orderNumber: string,
    orderAmount: number
  ): Promise<IVendorEarning> {
    const session = await mongoose.startSession();
    session.startTransaction();

    try {
      // Check if earning already exists for this order
      const existingEarning = await VendorEarningModel.findOne({ orderId: new mongoose.Types.ObjectId(orderId) });
      if (existingEarning) {
        await session.abortTransaction();
        return existingEarning;
      }

      // Calculate vendor share (90%) and platform commission (10%)
      const vendorShare = orderAmount * 0.9;
      const platformCommission = orderAmount * 0.1;

      // Create earning record
      const earning = new VendorEarningModel({
        vendorId: new mongoose.Types.ObjectId(vendorId),
        orderId: new mongoose.Types.ObjectId(orderId),
        orderNumber,
        orderAmount,
        vendorShare,
        platformCommission,
        currency: 'BHD',
        earnedDate: new Date(),
        payoutStatus: 'PENDING'
      });

      await earning.save({ session });

      // Update or create vendor wallet
      let wallet = await VendorWalletModel.findOne({ 
        vendorId: new mongoose.Types.ObjectId(vendorId) 
      }).session(session);

      if (!wallet) {
        wallet = new VendorWalletModel({
          vendorId: new mongoose.Types.ObjectId(vendorId),
          availableBalance: vendorShare,
          pendingBalance: 0,
          totalEarned: vendorShare,
          totalWithdrawn: 0,
          currency: 'BHD'
        });
      } else {
        wallet.availableBalance += vendorShare;
        wallet.totalEarned += vendorShare;
      }

      await wallet.save({ session });

      await session.commitTransaction();
      return earning;
    } catch (error) {
      await session.abortTransaction();
      console.error('Error creating vendor earning:', error);
      throw error;
    } finally {
      session.endSession();
    }
  }

  /**
   * Get or create vendor wallet
   */
  async getOrCreateVendorWallet(vendorId: string): Promise<IVendorWallet> {
    let wallet = await VendorWalletModel.findOne({ 
      vendorId: new mongoose.Types.ObjectId(vendorId) 
    });

    if (!wallet) {
      wallet = new VendorWalletModel({
        vendorId: new mongoose.Types.ObjectId(vendorId),
        availableBalance: 0,
        pendingBalance: 0,
        totalEarned: 0,
        totalWithdrawn: 0,
        currency: 'BHD'
      });
      await wallet.save();
    }

    return wallet;
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
      // Get vendor wallet
      const wallet = await VendorWalletModel.findOne({ 
        vendorId: new mongoose.Types.ObjectId(vendorId) 
      }).session(session);

      if (!wallet) {
        throw new Error('Vendor wallet not found');
      }

      // Check if sufficient balance
      if (wallet.availableBalance < data.requestedAmount) {
        throw new Error('Insufficient balance for payout');
      }

      // Check for pending payout requests
      const pendingRequest = await PayoutRequestModel.findOne({
        vendorId: new mongoose.Types.ObjectId(vendorId),
        status: { $in: [PayoutStatus.PENDING, PayoutStatus.PROCESSING] }
      }).session(session);

      if (pendingRequest) {
        throw new Error('You already have a pending payout request');
      }

      // Create payout request
      const payoutRequest = new PayoutRequestModel({
        vendorId: new mongoose.Types.ObjectId(vendorId),
        requestedAmount: data.requestedAmount,
        currency: 'BHD',
        payoutMethod: data.payoutMethod,
        bankDetails: data.bankDetails,
        paypalEmail: data.paypalEmail,
        stripeAccountId: data.stripeAccountId,
        status: PayoutStatus.PENDING,
        requestedDate: new Date(),
        notes: data.notes
      });

      await payoutRequest.save({ session });

      // Move amount from available to pending
      wallet.availableBalance -= data.requestedAmount;
      wallet.pendingBalance += data.requestedAmount;
      await wallet.save({ session });

      await session.commitTransaction();

      return payoutRequest;
    } catch (error) {
      await session.abortTransaction();
      console.error('Error creating payout request:', error);
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
      const payout = await PayoutRequestModel.findById(payoutId).session(session);

      if (!payout) {
        throw new Error('Payout request not found');
      }

      if (payout.status !== PayoutStatus.PENDING) {
        throw new Error('Payout request has already been processed');
      }

      const wallet = await VendorWalletModel.findOne({ 
        vendorId: payout.vendorId 
      }).session(session);

      if (!wallet) {
        throw new Error('Vendor wallet not found');
      }

      // Update payout request
      payout.status = data.status;
      payout.processedBy = new mongoose.Types.ObjectId(adminId);
      payout.processedDate = new Date();
      payout.transactionReference = data.transactionReference;
      payout.rejectionReason = data.rejectionReason;
      payout.notes = data.notes || payout.notes;

      if (data.status === PayoutStatus.COMPLETED) {
        payout.completedDate = new Date();
        
        // Update wallet
        wallet.pendingBalance -= payout.requestedAmount;
        wallet.totalWithdrawn += payout.requestedAmount;
        wallet.lastPayoutDate = new Date();

        // Mark earnings as paid
        await VendorEarningModel.updateMany(
          {
            vendorId: payout.vendorId,
            payoutStatus: 'PENDING',
            vendorShare: { $lte: payout.requestedAmount }
          },
          {
            $set: {
              payoutStatus: 'PAID',
              payoutId: payout._id
            }
          },
          { session }
        );
      } else if (data.status === PayoutStatus.REJECTED || data.status === PayoutStatus.FAILED) {
        // Return amount to available balance
        wallet.availableBalance += payout.requestedAmount;
        wallet.pendingBalance -= payout.requestedAmount;
      }

      await payout.save({ session });
      await wallet.save({ session });

      await session.commitTransaction();

      return payout;
    } catch (error) {
      await session.abortTransaction();
      console.error('Error processing payout request:', error);
      throw error;
    } finally {
      session.endSession();
    }
  }

  /**
   * Get vendor sales statistics
   */
  async getVendorSalesStats(
    vendorId: string,
    filters?: ISalesReportFilters
  ): Promise<IVendorSalesStats> {
    const query: any = { vendorId: new mongoose.Types.ObjectId(vendorId) };

    if (filters?.startDate || filters?.endDate) {
      query.earnedDate = {};
      if (filters.startDate) query.earnedDate.$gte = filters.startDate;
      if (filters.endDate) query.earnedDate.$lte = filters.endDate;
    }

    const earnings = await VendorEarningModel.find(query);

    const totalSales = earnings.reduce((sum, e) => sum + e.orderAmount, 0);
    const totalOrders = earnings.length;
    const vendorEarnings = earnings.reduce((sum, e) => sum + e.vendorShare, 0);
    const platformCommission = earnings.reduce((sum, e) => sum + e.platformCommission, 0);
    const pendingEarnings = earnings
      .filter(e => e.payoutStatus === 'PENDING')
      .reduce((sum, e) => sum + e.vendorShare, 0);
    const paidEarnings = earnings
      .filter(e => e.payoutStatus === 'PAID')
      .reduce((sum, e) => sum + e.vendorShare, 0);

    return {
      totalSales: Math.round(totalSales * 100) / 100,
      totalOrders,
      vendorEarnings: Math.round(vendorEarnings * 100) / 100,
      platformCommission: Math.round(platformCommission * 100) / 100,
      averageOrderValue: totalOrders > 0 ? Math.round((totalSales / totalOrders) * 100) / 100 : 0,
      pendingEarnings: Math.round(pendingEarnings * 100) / 100,
      paidEarnings: Math.round(paidEarnings * 100) / 100
    };
  }

  /**
   * Get vendor monthly sales breakdown
   */
  async getVendorMonthlySales(vendorId: string, year?: number): Promise<IMonthlySales[]> {
    const currentYear = year || new Date().getFullYear();
    const startDate = new Date(currentYear, 0, 1);
    const endDate = new Date(currentYear, 11, 31, 23, 59, 59);

    const earnings = await VendorEarningModel.aggregate([
      {
        $match: {
          vendorId: new mongoose.Types.ObjectId(vendorId),
          earnedDate: { $gte: startDate, $lte: endDate }
        }
      },
      {
        $group: {
          _id: {
            year: { $year: '$earnedDate' },
            month: { $month: '$earnedDate' }
          },
          totalSales: { $sum: '$orderAmount' },
          totalOrders: { $sum: 1 },
          vendorEarnings: { $sum: '$vendorShare' },
          platformCommission: { $sum: '$platformCommission' }
        }
      },
      {
        $sort: { '_id.year': 1, '_id.month': 1 }
      }
    ]);

    const monthNames = [
      'January', 'February', 'March', 'April', 'May', 'June',
      'July', 'August', 'September', 'October', 'November', 'December'
    ];

    return earnings.map(e => ({
      month: monthNames[e._id.month - 1],
      year: e._id.year,
      totalSales: Math.round(e.totalSales * 100) / 100,
      totalOrders: e.totalOrders,
      vendorEarnings: Math.round(e.vendorEarnings * 100) / 100,
      platformCommission: Math.round(e.platformCommission * 100) / 100
    }));
  }

  /**
   * Get admin commission statistics
   */
  async getAdminCommissionStats(filters?: ISalesReportFilters): Promise<IAdminCommissionStats> {
    const query: any = {};

    if (filters?.startDate || filters?.endDate) {
      query.earnedDate = {};
      if (filters.startDate) query.earnedDate.$gte = filters.startDate;
      if (filters.endDate) query.earnedDate.$lte = filters.endDate;
    }

    const earnings = await VendorEarningModel.find(query);

    const totalCommission = earnings.reduce((sum, e) => sum + e.platformCommission, 0);
    const totalVendorEarnings = earnings.reduce((sum, e) => sum + e.vendorShare, 0);
    const totalOrders = earnings.length;

    // Monthly breakdown
    const monthlyData = await VendorEarningModel.aggregate([
      { $match: query },
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
      commission: Math.round(m.commission * 100) / 100,
      vendorEarnings: Math.round(m.vendorEarnings * 100) / 100
    }));

    return {
      totalCommission: Math.round(totalCommission * 100) / 100,
      totalVendorEarnings: Math.round(totalVendorEarnings * 100) / 100,
      totalOrders,
      averageCommissionPerOrder: totalOrders > 0 ? Math.round((totalCommission / totalOrders) * 100) / 100 : 0,
      monthlyBreakdown
    };
  }

  /**
   * Get all payout requests with filters
   */
  async getAllPayoutRequests(filters?: IPayoutFilters): Promise<IPayoutRequest[]> {
    const query: any = {};

    if (filters?.vendorId) {
      query.vendorId = new mongoose.Types.ObjectId(filters.vendorId);
    }

    if (filters?.status) {
      query.status = filters.status;
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

    return await PayoutRequestModel.find(query)
      .populate('vendorId', 'name email businessName phone')
      .populate('processedBy', 'name email')
      .sort({ requestedDate: -1 });
  }

  /**
   * Get vendor payout requests
   */
  async getVendorPayoutRequests(vendorId: string): Promise<IPayoutRequest[]> {
    return await PayoutRequestModel.find({ 
      vendorId: new mongoose.Types.ObjectId(vendorId) 
    })
      .populate('processedBy', 'name email')
      .sort({ requestedDate: -1 });
  }

  /**
   * Get payout request by ID
   */
  async getPayoutRequestById(payoutId: string): Promise<IPayoutRequest | null> {
    return await PayoutRequestModel.findById(payoutId)
      .populate('vendorId', 'name email businessName phone address')
      .populate('processedBy', 'name email');
  }

  /**
   * Get vendor wallet
   */
  async getVendorWallet(vendorId: string): Promise<IVendorWallet | null> {
    return await VendorWalletModel.findOne({ 
      vendorId: new mongoose.Types.ObjectId(vendorId) 
    }).populate('vendorId', 'name email businessName');
  }

  /**
   * Get all vendor wallets (Admin)
   */
  async getAllVendorWallets(limit: number = 50, offset: number = 0): Promise<IVendorWallet[]> {
    return await VendorWalletModel.find()
      .populate('vendorId', 'name email businessName phone')
      .sort({ totalEarned: -1 })
      .limit(limit)
      .skip(offset);
  }

  /**
   * Get vendor earnings history
   */
  async getVendorEarnings(
    vendorId: string,
    filters?: ISalesReportFilters
  ): Promise<IVendorEarning[]> {
    const query: any = { vendorId: new mongoose.Types.ObjectId(vendorId) };

    if (filters?.startDate || filters?.endDate) {
      query.earnedDate = {};
      if (filters.startDate) query.earnedDate.$gte = filters.startDate;
      if (filters.endDate) query.earnedDate.$lte = filters.endDate;
    }

    return await VendorEarningModel.find(query)
      .populate('orderId')
      .sort({ earnedDate: -1 });
  }
}

export const payoutService = new PayoutService();