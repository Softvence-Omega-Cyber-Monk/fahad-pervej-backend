// src/controllers/payment.controller.ts

import { Request, Response } from 'express';
import { PaymentService } from './payments.service';
import { PaymentRequest } from './payments.interface';

export class PaymentController {
    private paymentService: PaymentService;

    constructor() {
        this.paymentService = new PaymentService();
    }

    /**
     * Create a new payment session
     */
    createSession = async (req: Request, res: Response): Promise<void> => {
        try {
            console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
            console.log('📝 CREATE SESSION REQUEST');
            console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
            console.log('Request Headers:', JSON.stringify(req.headers, null, 2));
            console.log('Request Body:', JSON.stringify(req.body, null, 2));
            console.log('Request Method:', req.method);
            console.log('Request URL:', req.originalUrl);

            const { authenticationLimit } = req.body;

            const session = await this.paymentService.createSession(authenticationLimit || 25);

            console.log('✅ Session created successfully:', JSON.stringify(session, null, 2));
            console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

            res.status(200).json({
                success: true,
                data: session,
            });
        } catch (error: any) {
            console.error('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
            console.error('❌ CREATE SESSION ERROR');
            console.error('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
            console.error('Error Message:', error.message);
            console.error('Error Stack:', error.stack);
            console.error('Error Response:', error.response?.data);
            console.error('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

            res.status(500).json({
                success: false,
                error: 'Failed to create payment session',
                message: error.message,
                details: process.env.NODE_ENV === 'development' ? error.stack : undefined,
            });
        }
    };

    /**
     * Update session with order details
     */
    updateSession = async (req: Request, res: Response): Promise<void> => {
        try {
            console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
            console.log('📝 UPDATE SESSION REQUEST');
            console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
            console.log('Request Headers:', JSON.stringify(req.headers, null, 2));
            console.log('Request Params:', JSON.stringify(req.params, null, 2));
            console.log('Request Body:', JSON.stringify(req.body, null, 2));

            const { sessionId } = req.params;
            const { amount, currency } = req.body;

            if (!amount || !currency) {
                console.error('❌ Validation failed - Missing fields');
                res.status(400).json({
                    success: false,
                    error: 'Amount and currency are required',
                    received: { amount, currency },
                });
                return;
            }

            console.log('✅ Validation passed');
            console.log('SessionID:', sessionId);
            console.log('Amount:', amount, typeof amount);
            console.log('Currency:', currency);

            await this.paymentService.updateSession(sessionId, amount, currency);

            console.log('✅ Session updated successfully');
            console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

            res.status(200).json({
                success: true,
                message: 'Session updated successfully',
            });
        } catch (error: any) {
            console.error('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
            console.error('❌ UPDATE SESSION ERROR');
            console.error('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
            console.error('Error Message:', error.message);
            console.error('Error Stack:', error.stack);
            console.error('Error Response:', error.response?.data);
            console.error('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

            res.status(500).json({
                success: false,
                error: 'Failed to update session',
                message: error.message,
            });
        }
    };

    /**
     * Process payment
     */
    processPayment = async (req: Request, res: Response): Promise<void> => {
        try {
            console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
            console.log('💳 PROCESS PAYMENT REQUEST');
            console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
            console.log('Request Headers:', JSON.stringify(req.headers, null, 2));
            console.log('Request Body:', JSON.stringify(req.body, null, 2));
            console.log('Request Method:', req.method);
            console.log('Request URL:', req.originalUrl);

            const { userId, sessionId, amount, currency, description, orderId } = req.body;

            // Detailed validation
            console.log('\n🔍 FIELD VALIDATION:');
            console.log('userId:', userId, '| Type:', typeof userId, '| Valid:', !!userId);
            console.log('sessionId:', sessionId, '| Type:', typeof sessionId, '| Valid:', !!sessionId);
            console.log('amount:', amount, '| Type:', typeof amount, '| Valid:', !!amount);
            console.log('currency:', currency, '| Type:', typeof currency, '| Valid:', !!currency);
            console.log('description:', description, '| Type:', typeof description);
            console.log('orderId:', orderId, '| Type:', typeof orderId);

            // Validate required fields
            if (!userId || !sessionId || !amount || !currency) {
                console.error('\n❌ VALIDATION FAILED - Missing required fields');
                const missingFields = {
                    userId: !userId,
                    sessionId: !sessionId,
                    amount: !amount,
                    currency: !currency,
                };
                console.error('Missing fields:', missingFields);

                res.status(400).json({
                    success: false,
                    error: 'Missing required fields',
                    message: 'userId, sessionId, amount, and currency are required',
                    missing: missingFields,
                    received: { userId, sessionId, amount, currency },
                });
                return;
            }

            // Validate amount type and value
            if (typeof amount !== 'number' || amount <= 0) {
                console.error('\n❌ VALIDATION FAILED - Invalid amount');
                console.error('Amount:', amount, 'Type:', typeof amount);
                res.status(400).json({
                    success: false,
                    error: 'Invalid amount',
                    message: 'Amount must be a positive number',
                    received: { amount, type: typeof amount },
                });
                return;
            }

            const paymentData: PaymentRequest = {
                userId,
                sessionId,
                amount,
                currency: currency.toUpperCase(),
                description,
                orderId,
            };

            console.log('\n✅ VALIDATION PASSED');
            console.log('Payment Data:', JSON.stringify(paymentData, null, 2));
            console.log('\n⏳ Processing payment...');

            const result = await this.paymentService.processPayment(paymentData);

            console.log('\n📊 PAYMENT RESULT:', JSON.stringify(result, null, 2));

            if (result.success) {
                console.log('✅ PAYMENT SUCCESSFUL');
                console.log('Transaction ID:', result.transactionId);
                console.log('Order ID:', result.orderId);
                console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

                res.status(200).json({
                    success: true,
                    data: result,
                    message: result.message,
                });
            } else {
                console.log('❌ PAYMENT FAILED');
                console.log('Error:', result.error);
                console.log('Message:', result.message);
                console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

                res.status(400).json({
                    success: false,
                    error: result.error,
                    message: result.message,
                });
            }
        } catch (error: any) {
            console.error('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
            console.error('💥 PROCESS PAYMENT EXCEPTION');
            console.error('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
            console.error('Error Name:', error.name);
            console.error('Error Message:', error.message);
            console.error('Error Stack:', error.stack);
            console.error('Error Response:', JSON.stringify(error.response?.data, null, 2));
            console.error('Error Status:', error.response?.status);
            console.error('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

            res.status(500).json({
                success: false,
                error: 'Payment processing failed',
                message: error.message,
                details: process.env.NODE_ENV === 'development' ? {
                    stack: error.stack,
                    response: error.response?.data,
                } : undefined,
            });
        }
    };

    /**
     * Get user payment history
     */
    getPaymentHistory = async (req: Request, res: Response): Promise<void> => {
        try {
            const { userId } = req.params;
            const limit = parseInt(req.query.limit as string) || 10;
            const offset = parseInt(req.query.offset as string) || 0;

            const payments = await this.paymentService.getUserPaymentHistory(userId, limit, offset);

            res.status(200).json({
                success: true,
                data: payments,
                pagination: {
                    limit,
                    offset,
                    total: payments.length,
                },
            });
        } catch (error: any) {
            console.error('Get payment history error:', error.message);
            res.status(500).json({
                success: false,
                error: 'Failed to fetch payment history',
                message: error.message,
            });
        }
    };

    /**
     * Get payment details by transaction ID
     */
    getPaymentDetails = async (req: Request, res: Response): Promise<void> => {
        try {
            const { transactionId } = req.params;

            const payment = await this.paymentService.getPaymentByTransactionId(transactionId);

            if (!payment) {
                res.status(404).json({
                    success: false,
                    error: 'Payment not found',
                });
                return;
            }

            res.status(200).json({
                success: true,
                data: payment,
            });
        } catch (error: any) {
            console.error('Get payment details error:', error.message);
            res.status(500).json({
                success: false,
                error: 'Failed to fetch payment details',
                message: error.message,
            });
        }
    };

    /**
     * Retrieve session details
     */
    retrieveSession = async (req: Request, res: Response): Promise<void> => {
        try {
            const { sessionId } = req.params;

            const session = await this.paymentService.retrieveSession(sessionId);

            res.status(200).json({
                success: true,
                data: session,
            });
        } catch (error: any) {
            console.error('Retrieve session error:', error.message);
            res.status(500).json({
                success: false,
                error: 'Failed to retrieve session',
                message: error.message,
            });
        }
    };
    complete3DSPayment = async (req: Request, res: Response): Promise<void> => {
        try {
            console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
            console.log('🔐 COMPLETE 3DS PAYMENT REQUEST');
            console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');

            const { orderId, sessionId, userId, description } = req.body;

            if (!orderId || !sessionId || !userId) {
                res.status(400).json({
                    success: false,
                    error: 'Missing required fields',
                    message: 'orderId, sessionId, and userId are required',
                });
                return;
            }

            const result = await this.paymentService.complete3DSPayment(orderId, sessionId, userId, description);

            if (result.success) {
                res.status(200).json({
                    success: true,
                    data: result,
                    message: result.message,
                });
            } else {
                res.status(400).json({
                    success: false,
                    error: result.error,
                    message: result.message,
                });
            }
        } catch (error: any) {
            console.error('Complete 3DS payment error:', error.message);
            res.status(500).json({
                success: false,
                error: 'Failed to complete 3DS payment',
                message: error.message,
            });
        }
    };
}