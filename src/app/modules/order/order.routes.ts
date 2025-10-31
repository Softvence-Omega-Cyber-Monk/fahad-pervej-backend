import { Router } from 'express';
import { OrderController } from './order.controller';
import { ValidationMiddleware } from '../../middlewares/validation.middleware';
import { verifyToken } from '../../middlewares/auth';
import { authorizeRoles } from '../../middlewares/roleAuth';

const router = Router();
const controller = new OrderController();

/**
 * @swagger
 * components:
 *   schemas:
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
 *         - shippingMethodId
 *         - transactionId
 *         - totalPrice
 *         - shippingFee
 *         - tax
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
 *         products:
 *           type: array
 *           items:
 *             type: object
 *             properties:
 *               productId:
 *                 type: string
 *                 example: 672304d53d6b4eee48e94e0e
 *               quantity:
 *                 type: integer
 *                 example: 2
 *         shippingMethodId:
 *           type: string
 *           example: 67230a1c3d6b4eee48e94e20
 *         transactionId:
 *           type: string
 *           example: TXN-1234567890
 *         totalPrice:
 *           type: number
 *           example: 99.99
 *         shippingFee:
 *           type: number
 *           example: 10.00
 *         discount:
 *           type: number
 *           example: 5.00
 *         tax:
 *           type: number
 *           example: 8.50
 *         promoCode:
 *           type: string
 *           example: SAVE10
 *         estimatedDeliveryDate:
 *           type: string
 *           format: date
 *           example: 2025-11-10
 *         orderNotes:
 *           type: string
 *           example: Please ring the doorbell
 *     UpdateOrderStatus:
 *       type: object
 *       required:
 *         - status
 *       properties:
 *         status:
 *           type: string
 *           enum: [PENDING, CONFIRMED, PREPARING_FOR_SHIPMENT, OUT_FOR_DELIVERY, DELIVERED, CANCELLED]
 *           example: CONFIRMED
 *         note:
 *           type: string
 *           example: Order confirmed and being processed
 *         trackingNumber:
 *           type: string
 *           example: TRACK123456789
 */

/**
 * @swagger
 * tags:
 *   name: Orders
 *   description: Manage customer orders, payments, and statuses
 */

/**
 * @swagger
 * /orders:
 *   post:
 *     summary: Create a new order
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
 *       400:
 *         description: Validation error
 *       401:
 *         description: Not authenticated
 */
router.post('/', verifyToken, authorizeRoles('CUSTOMER', 'ADMIN', 'VENDOR'), controller.createOrder);

/**
 * @swagger
 * /orders/my-orders:
 *   get:
 *     summary: Get logged-in user's orders
 *     tags: [Orders]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [PENDING, CONFIRMED, PREPARING_FOR_SHIPMENT, OUT_FOR_DELIVERY, DELIVERED, CANCELLED]
 *     responses:
 *       200:
 *         description: List of user's orders
 *       401:
 *         description: Unauthorized
 */
router.get('/my-orders', verifyToken, authorizeRoles('CUSTOMER', 'ADMIN', 'VENDOR'), controller.getMyOrders);

/**
 * @swagger
 * /orders/my-stats:
 *   get:
 *     summary: Get statistics of logged-in user's orders
 *     tags: [Orders]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Statistics retrieved successfully
 *       401:
 *         description: Unauthorized
 */
router.get('/my-stats', verifyToken, authorizeRoles('CUSTOMER', 'ADMIN', 'VENDOR'), controller.getMyOrderStats);

/**
 * @swagger
 * /orders/track/{orderNumber}:
 *   get:
 *     summary: Track an order by its order number
 *     tags: [Orders]
 *     parameters:
 *       - in: path
 *         name: orderNumber
 *         required: true
 *         schema:
 *           type: string
 *         example: ORD-ABC1234
 *     responses:
 *       200:
 *         description: Order tracking information retrieved successfully
 *       404:
 *         description: Order not found
 */
router.get('/track/:orderNumber', controller.getOrderByOrderNumber);

/**
 * @swagger
 * /orders/{id}/cancel:
 *   put:
 *     summary: Cancel an order
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
 *                 example: Changed my mind
 *     responses:
 *       200:
 *         description: Order cancelled successfully
 *       400:
 *         description: Cannot cancel order
 *       404:
 *         description: Order not found
 */
router.put('/:id/cancel', verifyToken, authorizeRoles('CUSTOMER', 'ADMIN', 'VENDOR'), ValidationMiddleware.validateObjectId, controller.cancelOrder);

/**
 * @swagger
 * /orders/admin:
 *   get:
 *     summary: Get all orders (Admin/Vendor)
 *     tags: [Orders]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [PENDING, CONFIRMED, PREPARING_FOR_SHIPMENT, OUT_FOR_DELIVERY, DELIVERED, CANCELLED]
 *       - in: query
 *         name: paymentStatus
 *         schema:
 *           type: string
 *           enum: [PENDING, COMPLETED, FAILED, REFUNDED]
 *       - in: query
 *         name: orderNumber
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
 *     responses:
 *       200:
 *         description: Orders retrieved successfully
 *       401:
 *         description: Unauthorized
 */
router.get('/admin', verifyToken, authorizeRoles('ADMIN', 'VENDOR'), controller.getAllOrders);

/**
 * @swagger
 * /orders/admin/stats:
 *   get:
 *     summary: Get admin/vendor order statistics
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
 *       401:
 *         description: Unauthorized
 */
router.get('/admin/stats', verifyToken, authorizeRoles('ADMIN', 'VENDOR'), controller.getOrderStats);

/**
 * @swagger
 * /orders/admin/recent:
 *   get:
 *     summary: Get recent orders (Admin/Vendor)
 *     tags: [Orders]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 10
 *     responses:
 *       200:
 *         description: Recent orders retrieved successfully
 *       401:
 *         description: Unauthorized
 */
router.get('/admin/recent', verifyToken, authorizeRoles('ADMIN', 'VENDOR'), controller.getRecentOrders);

/**
 * @swagger
 * /orders/admin/{id}:
 *   get:
 *     summary: Get an order by ID (Admin/Vendor)
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
 *         description: Order retrieved successfully
 *       404:
 *         description: Order not found
 */
router.get('/admin/:id', verifyToken, authorizeRoles('ADMIN', 'VENDOR'), ValidationMiddleware.validateObjectId, controller.getOrderById);

/**
 * @swagger
 * /orders/admin/{id}/status:
 *   put:
 *     summary: Update order status (Admin/Vendor)
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
 *         description: Order status updated successfully
 *       400:
 *         description: Invalid status transition
 *       404:
 *         description: Order not found
 */
router.put('/admin/:id/status', verifyToken, authorizeRoles('ADMIN', 'VENDOR'), ValidationMiddleware.validateObjectId, controller.updateOrderStatus);

/**
 * @swagger
 * /orders/admin/{id}/payment-status:
 *   put:
 *     summary: Update payment status (Admin/Vendor)
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
 *                 enum: [PENDING, COMPLETED, FAILED, REFUNDED]
 *     responses:
 *       200:
 *         description: Payment status updated successfully
 *       400:
 *         description: Invalid payment status
 *       404:
 *         description: Order not found
 */
router.put('/admin/:id/payment-status', controller.updatePaymentStatus);

/**
 * @swagger
 * /orders/admin/{id}:
 *   delete:
 *     summary: Delete an order (Admin only)
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
 *       401:
 *         description: Unauthorized
 */
router.delete('/admin/:id', verifyToken, authorizeRoles('ADMIN'), ValidationMiddleware.validateObjectId, controller.deleteOrder);

// NEW: Route for updating payment with payment history
/**
 * @swagger
 * /orders/admin/{id}/payment-history:
 *   put:
 *     summary: Update payment status with payment history
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
 *               - paymentHistory
 *             properties:
 *               paymentStatus:
 *                 type: string
 *                 enum: [pending, completed, failed, refunded]
 *               paymentHistory:
 *                 type: object
 *                 required:
 *                   - paymentGateway
 *                   - gatewayTransactionId
 *                   - amount
 *                   - currency
 *                 properties:
 *                   paymentGateway:
 *                     type: string
 *                     example: Mastercard AFS
 *                   gatewayTransactionId:
 *                     type: string
 *                     example: ORDER-1234567890-ABC
 *                   sessionId:
 *                     type: string
 *                     example: SESSION123456
 *                   resultIndicator:
 *                     type: string
 *                   successIndicator:
 *                     type: string
 *                   amount:
 *                     type: number
 *                     example: 150.50
 *                   currency:
 *                     type: string
 *                     example: USD
 *                   paymentMethod:
 *                     type: string
 *                     example: Credit Card
 *                   cardType:
 *                     type: string
 *                     example: Visa
 *                   lastFourDigits:
 *                     type: string
 *                     example: 1234
 *                   gatewayResponse:
 *                     type: object
 *     responses:
 *       200:
 *         description: Payment updated successfully with history
 *       400:
 *         description: Invalid request
 *       404:
 *         description: Order not found
 */
router.put('/admin/:id/payment-history', ValidationMiddleware.validateObjectId, controller.updatePaymentWithHistory);

router.delete('/admin/:id', verifyToken, authorizeRoles('ADMIN'), ValidationMiddleware.validateObjectId, controller.deleteOrder);

export const OrderRoute = router;
