import { Router } from 'express';
import { OrderController } from './order.controller';
import { ValidationMiddleware } from '../../middlewares/validation.middleware';

const router = Router();
const controller = new OrderController();

/**
 * @swagger
 * tags:
 *   name: Orders
 *   description: Order management and tracking
 */

/**
 * @swagger
 * components:
 *   schemas:
 *     OrderProduct:
 *       type: object
 *       properties:
 *         productId:
 *           type: string
 *           example: 507f1f77bcf86cd799439011
 *         quantity:
 *           type: number
 *           example: 2
 *         price:
 *           type: number
 *           example: 29.99
 *     
 *     ShippingAddress:
 *       type: object
 *       required:
 *         - fullName
 *         - mobileNumber
 *         - country
 *         - addressSpecific
 *         - city
 *         - state
 *         - zipCode
 *       properties:
 *         fullName:
 *           type: string
 *           example: John Doe
 *         mobileNumber:
 *           type: string
 *           example: +1234567890
 *         country:
 *           type: string
 *           example: United States
 *         addressSpecific:
 *           type: string
 *           example: 123 Main Street, Apt 4B
 *         city:
 *           type: string
 *           example: New York
 *         state:
 *           type: string
 *           example: NY
 *         zipCode:
 *           type: string
 *           example: 10001
 *     
 *     Order:
 *       type: object
 *       properties:
 *         _id:
 *           type: string
 *         userId:
 *           type: string
 *         orderNumber:
 *           type: string
 *           example: ORD-ABC123-XYZ
 *         shippingAddress:
 *           $ref: '#/components/schemas/ShippingAddress'
 *         products:
 *           type: array
 *           items:
 *             type: object
 *             properties:
 *               productId:
 *                 type: string
 *               quantity:
 *                 type: number
 *               price:
 *                 type: number
 *               total:
 *                 type: number
 *         totalPrice:
 *           type: number
 *         shippingFee:
 *           type: number
 *         discount:
 *           type: number
 *         tax:
 *           type: number
 *         grandTotal:
 *           type: number
 *         promoCode:
 *           type: string
 *           nullable: true
 *         estimatedDeliveryDate:
 *           type: string
 *           format: date-time
 *         actualDeliveryDate:
 *           type: string
 *           format: date-time
 *           nullable: true
 *         status:
 *           type: string
 *           enum: [Order Placed, Preparing for Shipment, Out for Delivery, Delivered, Cancelled]
 *         paymentStatus:
 *           type: string
 *           enum: [pending, completed, failed, refunded]
 *         shippingMethodId:
 *           type: string
 *         paymentId:
 *           type: string
 *         orderNotes:
 *           type: string
 *           nullable: true
 *         trackingNumber:
 *           type: string
 *           nullable: true
 *         statusHistory:
 *           type: array
 *           items:
 *             type: object
 *             properties:
 *               status:
 *                 type: string
 *               timestamp:
 *                 type: string
 *                 format: date-time
 *               note:
 *                 type: string
 *         createdAt:
 *           type: string
 *           format: date-time
 *         updatedAt:
 *           type: string
 *           format: date-time
 *     
 *     CreateOrder:
 *       type: object
 *       required:
 *         - fullName
 *         - mobileNumber
 *         - country
 *         - addressSpecific
 *         - city
 *         - state
 *         - zipCode
 *         - products
 *         - totalPrice
 *         - shippingFee
 *         - tax
 *         - estimatedDeliveryDate
 *         - shippingMethodId
 *         - paymentId
 *       properties:
 *         fullName:
 *           type: string
 *         mobileNumber:
 *           type: string
 *         country:
 *           type: string
 *         addressSpecific:
 *           type: string
 *         city:
 *           type: string
 *         state:
 *           type: string
 *         zipCode:
 *           type: string
 *         products:
 *           type: array
 *           items:
 *             $ref: '#/components/schemas/OrderProduct'
 *         totalPrice:
 *           type: number
 *         shippingFee:
 *           type: number
 *         discount:
 *           type: number
 *         tax:
 *           type: number
 *         promoCode:
 *           type: string
 *         estimatedDeliveryDate:
 *           type: string
 *           format: date-time
 *         shippingMethodId:
 *           type: string
 *         paymentId:
 *           type: string
 *         orderNotes:
 *           type: string
 *     
 *     UpdateOrderStatus:
 *       type: object
 *       required:
 *         - status
 *       properties:
 *         status:
 *           type: string
 *           enum: [Order Placed, Preparing for Shipment, Out for Delivery, Delivered, Cancelled]
 *         note:
 *           type: string
 *         trackingNumber:
 *           type: string
 *     
 *     OrderStats:
 *       type: object
 *       properties:
 *         totalOrders:
 *           type: number
 *         orderPlaced:
 *           type: number
 *         preparingForShipment:
 *           type: number
 *         outForDelivery:
 *           type: number
 *         delivered:
 *           type: number
 *         cancelled:
 *           type: number
 *         totalRevenue:
 *           type: number
 *         averageOrderValue:
 *           type: number
 */

/**
 * @swagger
 * /orders:
 *   post:
 *     summary: Create a new order
 *     description: Create a new order with shipping details and products
 *     tags: [Orders]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/CreateOrder'
 *     responses:
 *       201:
 *         description: Order created successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 message:
 *                   type: string
 *                 data:
 *                   type: object
 *                   properties:
 *                     orderId:
 *                       type: string
 *                     orderNumber:
 *                       type: string
 *                     status:
 *                       type: string
 *                     grandTotal:
 *                       type: number
 *                     estimatedDeliveryDate:
 *                       type: string
 *       400:
 *         description: Validation error
 *       401:
 *         description: User not authenticated
 */
router.post('/', controller.createOrder);

/**
 * @swagger
 * /orders/my-orders:
 *   get:
 *     summary: Get my orders
 *     description: Get all orders for the authenticated user
 *     tags: [Orders]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [Order Placed, Preparing for Shipment, Out for Delivery, Delivered, Cancelled]
 *     responses:
 *       200:
 *         description: Orders retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 count:
 *                   type: number
 *                 data:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/Order'
 */
router.get('/my-orders', controller.getMyOrders);

/**
 * @swagger
 * /orders/my-stats:
 *   get:
 *     summary: Get my order statistics
 *     description: Get order statistics for the authenticated user
 *     tags: [Orders]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Statistics retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   type: object
 *                   properties:
 *                     totalOrders:
 *                       type: number
 *                     totalSpent:
 *                       type: number
 *                     pendingOrders:
 *                       type: number
 *                     completedOrders:
 *                       type: number
 */
router.get('/my-stats', controller.getMyOrderStats);

/**
 * @swagger
 * /orders/track/{orderNumber}:
 *   get:
 *     summary: Track order by order number
 *     description: Get order details and tracking information by order number
 *     tags: [Orders]
 *     parameters:
 *       - in: path
 *         name: orderNumber
 *         required: true
 *         schema:
 *           type: string
 *         example: ORD-ABC123-XYZ
 *     responses:
 *       200:
 *         description: Order found
 *       404:
 *         description: Order not found
 */
router.get('/track/:orderNumber', controller.getOrderByOrderNumber);

/**
 * @swagger
 * /orders/{id}/cancel:
 *   put:
 *     summary: Cancel an order
 *     description: Cancel an order (only if not yet delivered)
 *     tags: [Orders]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               reason:
 *                 type: string
 *     responses:
 *       200:
 *         description: Order cancelled successfully
 *       400:
 *         description: Cannot cancel order
 */
router.put('/:id/cancel', ValidationMiddleware.validateObjectId, controller.cancelOrder);

/**
 * @swagger
 * /orders/admin:
 *   get:
 *     summary: Get all orders (Admin)
 *     description: Get all orders with optional filters
 *     tags: [Orders]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *       - in: query
 *         name: paymentStatus
 *         schema:
 *           type: string
 *       - in: query
 *         name: startDate
 *         schema:
 *           type: string
 *           format: date
 *       - in: query
 *         name: endDate
 *         schema:
 *           type: string
 *           format: date
 *       - in: query
 *         name: orderNumber
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Orders retrieved successfully
 */
router.get('/admin', controller.getAllOrders);

/**
 * @swagger
 * /orders/admin/stats:
 *   get:
 *     summary: Get order statistics (Admin)
 *     description: Get comprehensive order statistics
 *     tags: [Orders]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: startDate
 *         schema:
 *           type: string
 *           format: date
 *       - in: query
 *         name: endDate
 *         schema:
 *           type: string
 *           format: date
 *     responses:
 *       200:
 *         description: Statistics retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   $ref: '#/components/schemas/OrderStats'
 */
router.get('/admin/stats', controller.getOrderStats);

/**
 * @swagger
 * /orders/admin/recent:
 *   get:
 *     summary: Get recent orders (Admin)
 *     description: Get the most recent orders
 *     tags: [Orders]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: limit
 *         schema:
 *           type: number
 *           default: 10
 *     responses:
 *       200:
 *         description: Recent orders retrieved successfully
 */
router.get('/admin/recent', controller.getRecentOrders);

/**
 * @swagger
 * /orders/admin/{id}:
 *   get:
 *     summary: Get order by ID (Admin)
 *     description: Get detailed information about a specific order
 *     tags: [Orders]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Order found
 *       404:
 *         description: Order not found
 */
router.get('/admin/:id', ValidationMiddleware.validateObjectId, controller.getOrderById);

/**
 * @swagger
 * /orders/admin/{id}/status:
 *   put:
 *     summary: Update order status (Admin)
 *     description: Update the status of an order
 *     tags: [Orders]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/UpdateOrderStatus'
 *     responses:
 *       200:
 *         description: Status updated successfully
 *       400:
 *         description: Invalid status transition
 */
router.put('/admin/:id/status', ValidationMiddleware.validateObjectId, controller.updateOrderStatus);

/**
 * @swagger
 * /orders/admin/{id}/payment-status:
 *   put:
 *     summary: Update payment status (Admin)
 *     description: Update the payment status of an order
 *     tags: [Orders]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - paymentStatus
 *             properties:
 *               paymentStatus:
 *                 type: string
 *                 enum: [pending, completed, failed, refunded]
 *     responses:
 *       200:
 *         description: Payment status updated successfully
 */
router.put('/admin/:id/payment-status', ValidationMiddleware.validateObjectId, controller.updatePaymentStatus);

/**
 * @swagger
 * /orders/admin/{id}:
 *   delete:
 *     summary: Delete order (Admin)
 *     description: Permanently delete an order
 *     tags: [Orders]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Order deleted successfully
 *       404:
 *         description: Order not found
 */
router.delete('/admin/:id', ValidationMiddleware.validateObjectId, controller.deleteOrder);

export const OrderRoute = router;