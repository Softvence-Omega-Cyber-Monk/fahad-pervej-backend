// chat.controller.ts
// This file handles HTTP requests and sends responses

import { Request, Response } from 'express';
import chatService from './chat.service';

class ChatController {

  /**
   * Start a new conversation
   * POST /api/chat/conversations
   */
  async startConversation(req: Request, res: Response) {
    try {
      const { customerId, vendorId, productId, initialMessage } = req.body;

      // Validate required fields
      if (!customerId || !vendorId) {
        return res.status(400).json({
          success: false,
          message: 'Customer ID and Vendor ID are required'
        });
      }

      // Call service to create/get conversation
      const conversation = await chatService.startConversation({
        customerId,
        vendorId,
        productId,
        initialMessage
      });

      return res.status(201).json({
        success: true,
        message: 'Conversation started successfully',
        data: conversation
      });

    } catch (error) {
      console.error('Start conversation error:', error);
      return res.status(500).json({
        success: false,
        message: (error as Error).message
      });
    }
  }

  /**
   * Get all conversations for a user
   * GET /api/chat/conversations?userId=xxx&userType=customer&page=1&limit=20
   */
  async getConversations(req: Request, res: Response) {
    try {
      const { userId, userType, page, limit } = req.query;

      // Validate required fields
      if (!userId || !userType) {
        return res.status(400).json({
          success: false,
          message: 'User ID and User Type are required'
        });
      }

      if (userType !== 'customer' && userType !== 'vendor') {
        return res.status(400).json({
          success: false,
          message: 'User Type must be either customer or vendor'
        });
      }

      // Get conversations from service
      const result = await chatService.getConversations({
        userId: userId as string,
        userType: userType as 'customer' | 'vendor',
        page: page ? parseInt(page as string) : undefined,
        limit: limit ? parseInt(limit as string) : undefined
      });

      return res.status(200).json({
        success: true,
        message: 'Conversations fetched successfully',
        data: result.conversations,
        pagination: result.pagination
      });

    } catch (error) {
      console.error('Get conversations error:', error);
      return res.status(500).json({
        success: false,
        message: (error as Error).message
      });
    }
  }

  /**
   * Get a single conversation by ID
   * GET /api/chat/conversations/:conversationId?userId=xxx
   */
  async getConversationById(req: Request, res: Response) {
    try {
      const { conversationId } = req.params;
      const { userId } = req.query;

      // Validate required fields
      if (!userId) {
        return res.status(400).json({
          success: false,
          message: 'User ID is required'
        });
      }

      // Get conversation from service
      const conversation = await chatService.getConversationById(
        conversationId,
        userId as string
      );

      return res.status(200).json({
        success: true,
        message: 'Conversation fetched successfully',
        data: conversation
      });

    } catch (error) {
      console.error('Get conversation error:', error);
      return res.status(500).json({
        success: false,
        message: (error as Error).message
      });
    }
  }

  /**
   * Mark messages as read
   * PUT /api/chat/conversations/:conversationId/read
   */
  async markAsRead(req: Request, res: Response) {
    try {
      const { conversationId } = req.params;
      const { userType } = req.body;

      // Validate required fields
      if (!userType || (userType !== 'customer' && userType !== 'vendor')) {
        return res.status(400).json({
          success: false,
          message: 'Valid User Type (customer/vendor) is required'
        });
      }

      // Mark messages as read
      const conversation = await chatService.markMessagesAsRead(
        conversationId,
        userType
      );

      return res.status(200).json({
        success: true,
        message: 'Messages marked as read',
        data: conversation
      });

    } catch (error) {
      console.error('Mark as read error:', error);
      return res.status(500).json({
        success: false,
        message: (error as Error).message
      });
    }
  }

  /**
   * Get unread message count
   * GET /api/chat/unread?userId=xxx&userType=customer
   */
  async getUnreadCount(req: Request, res: Response) {
    try {
      const { userId, userType } = req.query;

      // Validate required fields
      if (!userId || !userType) {
        return res.status(400).json({
          success: false,
          message: 'User ID and User Type are required'
        });
      }

      if (userType !== 'customer' && userType !== 'vendor') {
        return res.status(400).json({
          success: false,
          message: 'User Type must be either customer or vendor'
        });
      }

      // Get unread count
      const unreadCount = await chatService.getUnreadCount(
        userId as string,
        userType as 'customer' | 'vendor'
      );

      return res.status(200).json({
        success: true,
        message: 'Unread count fetched successfully',
        data: { unreadCount }
      });

    } catch (error) {
      console.error('Get unread count error:', error);
      return res.status(500).json({
        success: false,
        message: (error as Error).message
      });
    }
  }
}

// Export a single instance of the controller
export default new ChatController();