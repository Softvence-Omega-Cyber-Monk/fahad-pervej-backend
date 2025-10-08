// chat.service.ts
// This file contains all the business logic for chat operations

import Conversation from './chat.model';
import { 
  ICreateMessageDTO, 
  IGetConversationsDTO, 
  IStartConversationDTO 
} from './chat.interface.js';

class ChatService {
  
  /**
   * Start a new conversation or get existing one
   * @param data - Contains customerId, vendorId, productId, and initial message
   * @returns The conversation object
   */
  async startConversation(data: IStartConversationDTO) {
    try {
      // Check if conversation already exists between this customer and vendor
      let conversation = await Conversation.findOne({
        customerId: data.customerId,
        vendorId: data.vendorId
      });

      // If conversation doesn't exist, create a new one
      if (!conversation) {
        conversation = new Conversation({
          customerId: data.customerId,
          vendorId: data.vendorId,
          productId: data.productId,
          messages: [],
          unreadCount: {
            customer: 0,
            vendor: 0
          }
        });

        // If there's an initial message, add it
        if (data.initialMessage) {
          conversation.messages.push({
            senderId: data.customerId,
            senderType: 'customer',
            message: data.initialMessage,
            timestamp: new Date(),
            isRead: false
          });
          conversation.lastMessage = data.initialMessage;
          conversation.lastMessageTime = new Date();
          conversation.unreadCount.vendor = 1;
        }

        await conversation.save();
      }

      return conversation;
    } catch (error) {
      throw new Error(`Error starting conversation: ${(error as Error).message}`);
    }
  }

  /**
   * Send a new message in an existing conversation
   * @param data - Contains conversationId, senderId, senderType, and message
   * @returns Updated conversation
   */
  async sendMessage(data: ICreateMessageDTO) {
    try {
      // Find the conversation by ID
      const conversation = await Conversation.findById(data.conversationId);

      if (!conversation) {
        throw new Error('Conversation not found');
      }

      // Create the new message object
      const newMessage = {
        senderId: data.senderId,
        senderType: data.senderType,
        message: data.message,
        timestamp: new Date(),
        isRead: false
      };

      // Add message to conversation
      conversation.messages.push(newMessage);
      conversation.lastMessage = data.message;
      conversation.lastMessageTime = new Date();

      // Increment unread count for the receiver
      if (data.senderType === 'customer') {
        conversation.unreadCount.vendor += 1;
      } else {
        conversation.unreadCount.customer += 1;
      }

      // Save the updated conversation
      await conversation.save();

      return {
        conversation,
        message: newMessage
      };
    } catch (error) {
      throw new Error(`Error sending message: ${(error as Error).message}`);
    }
  }

  /**
   * Get all conversations for a user (customer or vendor)
   * @param data - Contains userId, userType, page, and limit
   * @returns List of conversations with pagination
   */
  async getConversations(data: IGetConversationsDTO) {
    try {
      const page = data.page || 1;
      const limit = data.limit || 20;
      const skip = (page - 1) * limit;

      // Build query based on user type
      const query = data.userType === 'customer' 
        ? { customerId: data.userId }
        : { vendorId: data.userId };

      // Get conversations sorted by most recent
      const conversations = await Conversation.find(query)
        .sort({ lastMessageTime: -1 })  // Sort by most recent first
        .skip(skip)
        .limit(limit)
        .lean();  // Returns plain JavaScript objects (faster)

      // Get total count for pagination
      const total = await Conversation.countDocuments(query);

      return {
        conversations,
        pagination: {
          page,
          limit,
          total,
          totalPages: Math.ceil(total / limit)
        }
      };
    } catch (error) {
      throw new Error(`Error fetching conversations: ${(error as Error).message}`);
    }
  }

  /**
   * Get a single conversation with all messages
   * @param conversationId - The ID of the conversation
   * @param userId - The ID of the user requesting the conversation
   * @returns The conversation object
   */
  async getConversationById(conversationId: string, userId: string) {
    try {
      const conversation = await Conversation.findById(conversationId);

      if (!conversation) {
        throw new Error('Conversation not found');
      }

      // Check if user is part of this conversation
      if (conversation.customerId !== userId && conversation.vendorId !== userId) {
        throw new Error('Unauthorized access to conversation');
      }

      return conversation;
    } catch (error) {
      throw new Error(`Error fetching conversation: ${(error as Error).message}`);
    }
  }

  /**
   * Mark messages as read
   * @param conversationId - The ID of the conversation
   * @param userType - Whether the user is customer or vendor
   * @returns Updated conversation
   */
  async markMessagesAsRead(conversationId: string, userType: 'customer' | 'vendor') {
    try {
      const conversation = await Conversation.findById(conversationId);

      if (!conversation) {
        throw new Error('Conversation not found');
      }

      // Find unread messages sent by the other party
      const otherPartyType = userType === 'customer' ? 'vendor' : 'customer';
      
      // Mark all unread messages from other party as read
      conversation.messages.forEach((msg) => {
        if (msg.senderType === otherPartyType && !msg.isRead) {
          msg.isRead = true;
        }
      });

      // Reset unread count for this user
      if (userType === 'customer') {
        conversation.unreadCount.customer = 0;
      } else {
        conversation.unreadCount.vendor = 0;
      }

      await conversation.save();

      return conversation;
    } catch (error) {
      throw new Error(`Error marking messages as read: ${(error as Error).message}`);
    }
  }

  /**
   * Get unread message count for a user
   * @param userId - The ID of the user
   * @param userType - Whether the user is customer or vendor
   * @returns Total unread count
   */
  async getUnreadCount(userId: string, userType: 'customer' | 'vendor') {
    try {
      const query = userType === 'customer' 
        ? { customerId: userId }
        : { vendorId: userId };

      const conversations = await Conversation.find(query).select('unreadCount');

      // Sum up all unread counts
      const totalUnread = conversations.reduce((sum, conv) => {
        return sum + (userType === 'customer' 
          ? conv.unreadCount.customer 
          : conv.unreadCount.vendor);
      }, 0);

      return totalUnread;
    } catch (error) {
      throw new Error(`Error getting unread count: ${(error as Error).message}`);
    }
  }
}

// Export a single instance of the service
export default new ChatService();