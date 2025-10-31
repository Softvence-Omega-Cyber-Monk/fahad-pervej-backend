import Order from './order.model';
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

export class OrderService {
  async createOrder(userId: string, data: ICreateOrder): Promise<IOrder> {
    try {
      // Fetch products from database to populate product details
      const Product = mongoose.model('Product');
      const productIds = data.products.map(p => new mongoose.Types.ObjectId(p.productId));
      const products = await Product.find({ _id: { $in: productIds } })
        .select('_id pricePerUnit specialPrice specialPriceStartingDate specialPriceEndingDate');

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

        productMap.set(product._id.toString(), currentPrice);
      });

      // Map products with prices and totals
      const orderProducts = data.products.map(item => {
        const price = productMap.get(item.productId);
        if (price === undefined) {
          throw new Error(`Price not found for product ${item.productId}`);
        }

        return {
          productId: new mongoose.Types.ObjectId(item.productId),
          quantity: item.quantity,
          price: price,
          total: item.quantity * price
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
        transactionId: data.transactionId,
        orderNotes: data.orderNotes || null,
        status: OrderStatus.PENDING,
        paymentStatus: PaymentStatus.PENDING,
        paymentHistory: [] // Initialize empty payment history
      };

      const order = new Order(orderData);
      await order.save();

      // Populate product details
      await order.populate('products.productId', 'productName mainImageUrl pricePerUnit specialPrice');

      return order;
    } catch (error) {
      console.error('Error creating order:', error);
      throw error;
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
      .populate('userId', 'name email phone profileImage role businessName')
      .populate('products.productId', 'productName mainImageUrl pricePerUnit specialPrice')
      .populate('shippingMethodId', 'name code contactEmail contactPhone trackingUrl')
      .sort({ createdAt: -1 });

    return orders;
  }

  async getOrderById(orderId: string): Promise<IOrder | null> {
    const order = await Order.findById(orderId)
      .populate('userId', 'name email phone profileImage address role businessName country')
      .populate('products.productId', 'productName mainImageUrl sideImageUrl pricePerUnit specialPrice productDescription stock')
      .populate('shippingMethodId', 'name code description contactEmail contactPhone trackingUrl logo');

    return order;
  }

  async getOrderByOrderNumber(orderNumber: string): Promise<IOrder | null> {
    const order = await Order.findOne({ orderNumber: orderNumber.toUpperCase() })
      .populate('userId', 'name email phone profileImage')
      .populate('products.productId', 'productName mainImageUrl pricePerUnit specialPrice')
      .populate('shippingMethodId', 'name code trackingUrl');

    return order;
  }

  async getUserOrders(userId: string, filters?: { status?: OrderStatus }): Promise<IOrder[]> {
    const query: any = { userId: new mongoose.Types.ObjectId(userId) };

    if (filters?.status) {
      query.status = filters.status;
    }

    const orders = await Order.find(query)
      .populate('userId', 'name email phone profileImage')
      .populate('products.productId', 'productName mainImageUrl pricePerUnit specialPrice')
      .populate('shippingMethodId', 'name code trackingUrl')
      .sort({ createdAt: -1 });

    return orders;
  }

  async updateOrderStatus(
    orderId: string,
    data: IUpdateOrderStatus
  ): Promise<IOrder> {
    const order = await Order.findById(orderId);

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
    }

    await order.save();
    return order;
  }

  async cancelOrder(orderId: string, reason?: string): Promise<IOrder> {
    const order = await Order.findById(orderId);

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

    // Update status to cancelled
    order.status = OrderStatus.CANCELLED;
    order.statusHistory.push({
      status: OrderStatus.CANCELLED,
      timestamp: new Date(),
      note: reason || 'Order cancelled by user'
    });

    await order.save();
    return order;
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

  // NEW: Update payment status with payment history
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
      .populate('userId', 'name email phone profileImage businessName')
      .populate('products.productId', 'productName mainImageUrl pricePerUnit specialPrice')
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