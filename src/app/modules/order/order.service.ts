import Order from './order.model';
import {
  IOrder,
  ICreateOrder,
  IUpdateOrderStatus,
  IOrderFilters,
  IOrderStats,
  IUserOrderStats,
  OrderStatus,
  PaymentStatus
} from './order.interface';

export class OrderService {
  async createOrder(userId: string, data: ICreateOrder): Promise<IOrder> {
    // Calculate product totals
    const products = data.products.map(product => ({
      productId: product.productId,
      quantity: product.quantity,
      price: product.price,
      total: product.quantity * product.price
    }));

    // Calculate grand total
    const discount = data.discount || 0;
    const grandTotal = data.totalPrice + data.shippingFee + data.tax - discount;

    const orderData = {
      userId,
      shippingAddress: {
        fullName: data.fullName,
        mobileNumber: data.mobileNumber,
        country: data.country,
        addressSpecific: data.addressSpecific,
        city: data.city,
        state: data.state,
        zipCode: data.zipCode
      },
      products,
      totalPrice: data.totalPrice,
      shippingFee: data.shippingFee,
      discount,
      tax: data.tax,
      grandTotal,
      promoCode: data.promoCode || null,
      estimatedDeliveryDate: data.estimatedDeliveryDate,
      shippingMethodId: data.shippingMethodId,
      paymentId: data.paymentId,
      orderNotes: data.orderNotes || null
    };

    const order = new Order(orderData);
    await order.save();
    
    return order;
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
      .populate('userId', 'name email')
      .populate('products.productId', 'name image price')
      .populate('shippingMethodId', 'name price estimatedDays')
      .populate('paymentId', 'method status transactionId')
      .sort({ createdAt: -1 });

    return orders;
  }

  async getOrderById(orderId: string): Promise<IOrder | null> {
    const order = await Order.findById(orderId)
      .populate('userId', 'name email phone')
      .populate('products.productId', 'name image price description')
      .populate('shippingMethodId', 'name price estimatedDays')
      .populate('paymentId', 'method status transactionId amount');

    return order;
  }

  async getOrderByOrderNumber(orderNumber: string): Promise<IOrder | null> {
    const order = await Order.findOne({ orderNumber: orderNumber.toUpperCase() })
      .populate('userId', 'name email phone')
      .populate('products.productId', 'name image price')
      .populate('shippingMethodId', 'name price estimatedDays')
      .populate('paymentId', 'method status transactionId');

    return order;
  }

  async getUserOrders(userId: string, filters?: { status?: OrderStatus }): Promise<IOrder[]> {
    const query: any = { userId };

    if (filters?.status) {
      query.status = filters.status;
    }

    const orders = await Order.find(query)
      .populate('products.productId', 'name image price')
      .populate('shippingMethodId', 'name price')
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
    const orderPlaced = await Order.countDocuments({ ...query, status: OrderStatus.ORDER_PLACED });
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
      orderPlaced,
      preparingForShipment,
      outForDelivery,
      delivered,
      cancelled,
      totalRevenue: Math.round(totalRevenue * 100) / 100,
      averageOrderValue: Math.round(averageOrderValue * 100) / 100
    };
  }

  async getUserOrderStats(userId: string): Promise<IUserOrderStats> {
    const totalOrders = await Order.countDocuments({ userId });
    const pendingOrders = await Order.countDocuments({
      userId,
      status: { $in: [OrderStatus.ORDER_PLACED, OrderStatus.PREPARING_FOR_SHIPMENT, OrderStatus.OUT_FOR_DELIVERY] }
    });
    const completedOrders = await Order.countDocuments({
      userId,
      status: OrderStatus.DELIVERED
    });

    const spentResult = await Order.aggregate([
      { $match: { userId, status: { $ne: OrderStatus.CANCELLED } } },
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
      .populate('userId', 'name email')
      .populate('products.productId', 'name image')
      .sort({ createdAt: -1 })
      .limit(limit);

    return orders;
  }

  private validateStatusTransition(currentStatus: OrderStatus, newStatus: OrderStatus): void {
    const validTransitions: { [key: string]: OrderStatus[] } = {
      [OrderStatus.ORDER_PLACED]: [
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