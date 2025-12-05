import Order from './order.model';
import { payoutService } from '../payout/payout.service';
import { emailService } from './email.service';
import mongoose from 'mongoose';
import {
  IOrder,
  ICreateOrder,
  IUpdateOrderStatus,
  IOrderFilters,
  IOrderStats,
  IUserOrderStats,
  IUpdatePaymentWithHistory,
  OrderStatus,
  PaymentStatus
} from './order.interface';
import { walletService } from '../wallet/wallet.service';


export class OrderService {
  async createOrder(userId: string, data: any): Promise<IOrder> {
    const session = await mongoose.startSession();
    session.startTransaction();

    try {
      // Fetch products from database to populate product details
      const Product = mongoose.model('Product');
      const productIds = data.products.map((p: { productId: number; }) => new mongoose.Types.ObjectId(p.productId));
      
      // FIXED: Changed vendorId to userId (which is the seller/vendor in Product schema)
      const products = await Product.find({ _id: { $in: productIds } })
        .select('_id pricePerUnit specialPrice specialPriceStartingDate specialPriceEndingDate productName userId')
        .populate('userId', 'name email role'); // userId contains the vendor/seller information

      if (products.length !== data.products.length) {
        throw new Error('One or more products not found');
      }

      // Create a map for quick price lookup
      const productMap = new Map();
      products.forEach((product: any) => {
        let currentPrice = product.pricePerUnit;

        if (
          product.specialPrice &&
          product.specialPriceStartingDate &&
          product.specialPriceEndingDate
        ) {
          const now = new Date();
          const startDate = new Date(product.specialPriceStartingDate);
          const endDate = new Date(product.specialPriceEndingDate);

          if (now >= startDate && now <= endDate) {
            currentPrice = product.specialPrice;
          }
        }

        productMap.set(product._id.toString(), {
          price: currentPrice,
          productName: product.productName,
          vendor: product.userId // This is the vendor/seller
        });
      });

      // Map products with prices and totals
      const orderProducts = data.products.map((item: { productId: number; quantity: number; }) => {
        const productData = productMap.get(item.productId);
        if (!productData) {
          throw new Error(`Price not found for product ${item.productId}`);
        }

        return {
          productId: new mongoose.Types.ObjectId(item.productId),
          quantity: item.quantity,
          price: productData.price,
          total: item.quantity * productData.price
        };
      });

      // Use values from frontend
      const discount = data.discount || 0;
      const grandTotal = data.totalPrice + data.shippingFee + data.tax - discount;

      // Generate a unique order number (always uppercase)
      const orderNumber = `ORD-${Date.now()}-${Math.floor(Math.random() * 1000)}`;

      // Set estimated delivery date (7 days from now if not provided)
      const estimatedDeliveryDate = data.estimatedDeliveryDate
        ? new Date(data.estimatedDeliveryDate)
        : new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);

      // Handle wallet payment
      let paymentStatus = PaymentStatus.PENDING;
      let orderStatus = OrderStatus.PENDING;
      let transactionId = data.transactionId;

      if (data.paymentMethod === 'WALLET') {
        // Check if user has sufficient balance
        const hasSufficient = await walletService.hasSufficientBalance(userId, grandTotal);

        if (!hasSufficient) {
          throw new Error('Insufficient wallet balance');
        }

        // Debit wallet
        await walletService.debitWallet(userId, {
          amount: grandTotal,
          orderId: orderNumber,
          description: `Payment for order ${orderNumber}`
        });

        paymentStatus = PaymentStatus.COMPLETED;
        orderStatus = OrderStatus.CONFIRMED;
        transactionId = `WALLET-${Date.now()}`;
      }

      const orderData = {
        orderNumber,
        userId: new mongoose.Types.ObjectId(userId),
        shippingAddress: {
          fullName: data.fullName,
          mobileNumber: data.mobileNumber,
          country: data.country,
          addressSpecific: data.addressSpecific,
          city: data.city,
          state: data.state,
          zipCode: data.zipCode
        },
        products: orderProducts,
        totalPrice: data.totalPrice,
        shippingFee: data.shippingFee,
        discount: discount,
        tax: data.tax,
        grandTotal: grandTotal,
        promoCode: data.promoCode || null,
        estimatedDeliveryDate,
        shippingMethodId: new mongoose.Types.ObjectId(data.shippingMethodId),
        transactionId: transactionId,
        orderNotes: data.orderNotes || null,
        status: orderStatus,
        paymentStatus: paymentStatus,
        paymentHistory: data.paymentMethod === 'WALLET' ? [{
          paymentGateway: 'Wallet System',
          gatewayTransactionId: transactionId,
          amount: grandTotal,
          currency: 'BHD',
          paymentStatus: PaymentStatus.COMPLETED,
          paymentMethod: 'Wallet',
          paymentDate: new Date()
        }] : []
      };

      const order = new Order(orderData);
      await order.save({ session });

      await session.commitTransaction();

      // Populate product details
      await order.populate('products.productId', 'productName mainImageUrl pricePerUnit specialPrice');
      await order.populate('userId', 'name email');

      // ===== Send email notifications to vendors =====
      try {
        // Group products by vendor (userId in Product model)
        const vendorProductsMap = new Map();

        products.forEach((product: any, index: number) => {
          // product.userId contains the vendor information
          if (product.userId && product.userId.email) {
            const vendorId = product.userId._id.toString();
            const vendorEmail = product.userId.email;
            const vendorName = product.userId.name || 'Vendor';

            if (!vendorProductsMap.has(vendorId)) {
              vendorProductsMap.set(vendorId, {
                vendorEmail,
                vendorName,
                products: []
              });
            }

            // Find the corresponding order product
            const orderProduct = data.products[index];
            const productData = productMap.get(product._id.toString());

            vendorProductsMap.get(vendorId).products.push({
              productName: product.productName,
              quantity: orderProduct.quantity,
              price: productData.price,
              total: orderProduct.quantity * productData.price
            });
          }
        });

        // Send email to each vendor
        for (const [vendorId, vendorData] of vendorProductsMap) {
          await emailService.sendVendorOrderNotification({
            vendorEmail: vendorData.vendorEmail,
            vendorName: vendorData.vendorName,
            order: order.toObject(),
            products: vendorData.products
          });
        }

        // Send confirmation email to customer
        const customer = order.userId as any;
        if (customer && customer.email) {
          await emailService.sendCustomerOrderConfirmation(
            customer.email,
            customer.name || data.fullName,
            order.toObject()
          );
        }
      } catch (emailError) {
        // Log email error but don't fail the order creation
        console.error('Error sending order notification emails:', emailError);
      }

      return order;
    } catch (error) {
      await session.abortTransaction();
      console.error('Error creating order:', error);
      throw error;
    } finally {
      session.endSession();
    }
  }

  async getAllOrders(filters: IOrderFilters = {}): Promise<IOrder[]> {
    const query: any = {};

    if (filters.userId) {
      query.userId = filters.userId;
    }

    if (filters.status) {
      query.status = filters.status;
    }

    if (filters.paymentStatus) {
      query.paymentStatus = filters.paymentStatus;
    }

    if (filters.orderNumber) {
      query.orderNumber = filters.orderNumber.toUpperCase();
    }

    if (filters.startDate || filters.endDate) {
      query.createdAt = {};
      if (filters.startDate) {
        query.createdAt.$gte = filters.startDate;
      }
      if (filters.endDate) {
        query.createdAt.$lte = filters.endDate;
      }
    }

    const orders = await Order.find(query)
      .populate('userId', 'name email phone address')
      .populate('products.productId')
      .populate('shippingMethodId', 'name code contactEmail contactPhone trackingUrl')
      .sort({ createdAt: -1 });

    return orders;
  }

  async getOrderById(orderId: string): Promise<IOrder | null> {
    const order = await Order.findById(orderId)
      .populate('userId', 'name email phone address')
      .populate('products.productId')
      .populate('shippingMethodId', 'name code description contactEmail contactPhone trackingUrl logo');

    return order;
  }

  async getOrderByOrderNumber(orderNumber: string): Promise<IOrder | null> {
    const order = await Order.findOne({ orderNumber: orderNumber.toUpperCase() })
      .populate('userId', 'name email phone')
      .populate('products.productId')
      .populate('shippingMethodId', 'name code trackingUrl');

    return order;
  }

  async getUserOrders(userId: string, filters?: { status?: OrderStatus }): Promise<IOrder[]> {
    const query: any = { userId: new mongoose.Types.ObjectId(userId) };

    if (filters?.status) {
      query.status = filters.status;
    }

    const orders = await Order.find(query)
      .populate('userId', 'name email phone')
      .populate('products.productId')
      .populate('shippingMethodId', 'name code trackingUrl')
      .sort({ createdAt: -1 });

    return orders;
  }

  async updateOrderStatus(
    orderId: string,
    data: IUpdateOrderStatus
  ): Promise<IOrder> {
    const order = await Order.findById(orderId)
      .populate('products.productId', 'userId'); // Changed from vendorId to userId

    if (!order) {
      throw new Error('Order not found');
    }

    // Validate status transition
    this.validateStatusTransition(order.status, data.status);

    // Update status
    order.status = data.status;

    // Add to status history
    order.statusHistory.push({
      status: data.status,
      timestamp: new Date(),
      note: data.note
    });

    // Update tracking number if provided
    if (data.trackingNumber) {
      order.trackingNumber = data.trackingNumber;
    }

    // Set actual delivery date if status is delivered
    if (data.status === OrderStatus.DELIVERED && !order.actualDeliveryDate) {
      order.actualDeliveryDate = new Date();

      // Create vendor earning when order is delivered
      try {
        // Get vendor ID from the first product's userId field
        const firstProduct = order.products[0] as any;

        if (firstProduct?.productId?.userId) {
          const vendorId = firstProduct.productId.userId.toString();

          // Create vendor earning (90% to vendor, 10% platform commission)
          await payoutService.createVendorEarning(
            vendorId,
            (order._id as any).toString(),
            order.orderNumber,
            order.grandTotal
          );

          console.log(`Vendor earning created for order ${order.orderNumber}`);
        }
      } catch (error) {
        console.error('Error creating vendor earning:', error);
        // Don't throw error to prevent order status update failure
      }
    }

    await order.save();
    return order;
  }

  async cancelOrder(orderId: string, reason?: string): Promise<IOrder> {
    const session = await mongoose.startSession();
    session.startTransaction();

    try {
      const order = await Order.findById(orderId).session(session);

      if (!order) {
        throw new Error('Order not found');
      }

      // Check if order can be cancelled
      if (order.status === OrderStatus.DELIVERED) {
        throw new Error('Cannot cancel a delivered order');
      }

      if (order.status === OrderStatus.CANCELLED) {
        throw new Error('Order is already cancelled');
      }

      if (order.status === OrderStatus.OUT_FOR_DELIVERY) {
        throw new Error('Cannot cancel order that is out for delivery');
      }

      // If order was paid via wallet, refund to wallet
      if (order.paymentStatus === PaymentStatus.COMPLETED &&
        order.paymentHistory.some(p => p.paymentGateway === 'Wallet System')) {
        await walletService.refundToWallet(
          order.userId.toString(),
          order.grandTotal,
          order.id.toString(),
          `Refund for cancelled order ${order.orderNumber}`
        );
      }

      // Update status to cancelled
      order.status = OrderStatus.CANCELLED;
      order.paymentStatus = PaymentStatus.REFUNDED;
      order.statusHistory.push({
        status: OrderStatus.CANCELLED,
        timestamp: new Date(),
        note: reason || 'Order cancelled by user'
      });

      await order.save({ session });
      await session.commitTransaction();

      return order;
    } catch (error) {
      await session.abortTransaction();
      throw error;
    } finally {
      session.endSession();
    }
  }

  async updatePaymentStatus(
    orderId: string,
    paymentStatus: PaymentStatus
  ): Promise<IOrder> {
    const order = await Order.findById(orderId);

    if (!order) {
      throw new Error('Order not found');
    }

    order.paymentStatus = paymentStatus;
    await order.save();

    return order;
  }

  async updatePaymentWithHistory(
    orderId: string,
    data: IUpdatePaymentWithHistory
  ): Promise<IOrder> {
    const order = await Order.findById(orderId);

    if (!order) {
      throw new Error('Order not found');
    }

    // Update payment status
    order.paymentStatus = data.paymentStatus;

    // Add payment history entry
    order.paymentHistory.push({
      paymentGateway: data.paymentHistory.paymentGateway,
      gatewayTransactionId: data.paymentHistory.gatewayTransactionId,
      sessionId: data.paymentHistory.sessionId,
      resultIndicator: data.paymentHistory.resultIndicator,
      successIndicator: data.paymentHistory.successIndicator,
      amount: data.paymentHistory.amount,
      currency: data.paymentHistory.currency,
      paymentStatus: data.paymentStatus,
      paymentMethod: data.paymentHistory.paymentMethod,
      cardType: data.paymentHistory.cardType,
      lastFourDigits: data.paymentHistory.lastFourDigits,
      paymentDate: new Date(),
      gatewayResponse: data.paymentHistory.gatewayResponse
    });

    // If payment is successful, update order status to Confirmed
    if (data.paymentStatus === PaymentStatus.COMPLETED && order.status === OrderStatus.PENDING) {
      order.status = OrderStatus.CONFIRMED;
      order.statusHistory.push({
        status: OrderStatus.CONFIRMED,
        timestamp: new Date(),
        note: 'Payment completed - Order confirmed'
      });
    }

    await order.save();
    return order;
  }

  async deleteOrder(orderId: string): Promise<IOrder | null> {
    const order = await Order.findByIdAndDelete(orderId);
    return order;
  }

  async getOrderStats(filters?: IOrderFilters): Promise<IOrderStats> {
    const query: any = {};

    if (filters?.startDate || filters?.endDate) {
      query.createdAt = {};
      if (filters.startDate) {
        query.createdAt.$gte = filters.startDate;
      }
      if (filters.endDate) {
        query.createdAt.$lte = filters.endDate;
      }
    }

    const totalOrders = await Order.countDocuments(query);
    const pending = await Order.countDocuments({ ...query, status: OrderStatus.PENDING });
    const confirmed = await Order.countDocuments({ ...query, status: OrderStatus.CONFIRMED });
    const preparingForShipment = await Order.countDocuments({
      ...query,
      status: OrderStatus.PREPARING_FOR_SHIPMENT
    });
    const outForDelivery = await Order.countDocuments({
      ...query,
      status: OrderStatus.OUT_FOR_DELIVERY
    });
    const delivered = await Order.countDocuments({ ...query, status: OrderStatus.DELIVERED });
    const cancelled = await Order.countDocuments({ ...query, status: OrderStatus.CANCELLED });

    const revenueResult = await Order.aggregate([
      { $match: { ...query, status: { $ne: OrderStatus.CANCELLED } } },
      {
        $group: {
          _id: null,
          totalRevenue: { $sum: '$grandTotal' },
          count: { $sum: 1 }
        }
      }
    ]);

    const totalRevenue = revenueResult.length > 0 ? revenueResult[0].totalRevenue : 0;
    const averageOrderValue = revenueResult.length > 0 && revenueResult[0].count > 0
      ? totalRevenue / revenueResult[0].count
      : 0;

    return {
      totalOrders,
      pending,
      confirmed,
      preparingForShipment,
      outForDelivery,
      delivered,
      cancelled,
      totalRevenue: Math.round(totalRevenue * 100) / 100,
      averageOrderValue: Math.round(averageOrderValue * 100) / 100
    };
  }

  async getUserOrderStats(userId: string): Promise<IUserOrderStats> {
    const userObjectId = new mongoose.Types.ObjectId(userId);

    const totalOrders = await Order.countDocuments({ userId: userObjectId });
    const pendingOrders = await Order.countDocuments({
      userId: userObjectId,
      status: {
        $in: [
          OrderStatus.PENDING,
          OrderStatus.CONFIRMED,
          OrderStatus.PREPARING_FOR_SHIPMENT,
          OrderStatus.OUT_FOR_DELIVERY
        ]
      }
    });
    const completedOrders = await Order.countDocuments({
      userId: userObjectId,
      status: OrderStatus.DELIVERED
    });

    const spentResult = await Order.aggregate([
      { $match: { userId: userObjectId, status: { $ne: OrderStatus.CANCELLED } } },
      {
        $group: {
          _id: null,
          totalSpent: { $sum: '$grandTotal' }
        }
      }
    ]);

    const totalSpent = spentResult.length > 0 ? spentResult[0].totalSpent : 0;

    return {
      totalOrders,
      totalSpent: Math.round(totalSpent * 100) / 100,
      pendingOrders,
      completedOrders
    };
  }

  async getRecentOrders(limit: number = 10): Promise<IOrder[]> {
    const orders = await Order.find()
      .populate('userId', 'name email phone')
      .populate('products.productId')
      .populate('shippingMethodId', 'name code trackingUrl')
      .sort({ createdAt: -1 })
      .limit(limit);

    return orders;
  }

  private validateStatusTransition(currentStatus: OrderStatus, newStatus: OrderStatus): void {
    const validTransitions: { [key: string]: OrderStatus[] } = {
      [OrderStatus.PENDING]: [
        OrderStatus.CONFIRMED,
        OrderStatus.CANCELLED
      ],
      [OrderStatus.CONFIRMED]: [
        OrderStatus.PREPARING_FOR_SHIPMENT,
        OrderStatus.CANCELLED
      ],
      [OrderStatus.PREPARING_FOR_SHIPMENT]: [
        OrderStatus.OUT_FOR_DELIVERY,
        OrderStatus.CANCELLED
      ],
      [OrderStatus.OUT_FOR_DELIVERY]: [
        OrderStatus.DELIVERED
      ],
      [OrderStatus.DELIVERED]: [],
      [OrderStatus.CANCELLED]: []
    };

    if (!validTransitions[currentStatus]?.includes(newStatus)) {
      throw new Error(`Cannot transition from ${currentStatus} to ${newStatus}`);
    }
  }
}