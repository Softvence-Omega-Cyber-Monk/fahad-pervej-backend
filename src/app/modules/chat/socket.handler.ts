// socket.handler.ts
// This file handles real-time chat using Socket.IO

import { Server, Socket } from 'socket.io';
import chatService from './chat.service';

// Store online users: key = userId, value = socketId
const onlineUsers = new Map<string, string>();

/**
 * Initialize Socket.IO for chat
 * @param io - Socket.IO server instance
 */
export const initializeChatSocket = (io: Server) => {
  
  // When a client connects
  io.on('connection', (socket: Socket) => {
    console.log('User connected:', socket.id);

    /**
     * Event: User comes online
     * Client should emit this with their userId when they connect
     */
    socket.on('user:online', (userId: string) => {
      // Store the user's socket ID
      onlineUsers.set(userId, socket.id);
      console.log(`User ${userId} is online with socket ${socket.id}`);
      
      // Join a room with their userId (for private messages)
      socket.join(userId);
      
      // Notify others that this user is online (optional)
      socket.broadcast.emit('user:status', {
        userId,
        status: 'online'
      });
    });

    /**
     * Event: Join a specific conversation room
     * This allows real-time updates for that conversation
     */
    socket.on('conversation:join', (conversationId: string) => {
      socket.join(conversationId);
      console.log(`Socket ${socket.id} joined conversation ${conversationId}`);
    });

    /**
     * Event: Leave a conversation room
     */
    socket.on('conversation:leave', (conversationId: string) => {
      socket.leave(conversationId);
      console.log(`Socket ${socket.id} left conversation ${conversationId}`);
    });

    /**
     * Event: Send a message
     * Client sends: { conversationId, senderId, senderType, message }
     */
    socket.on('message:send', async (data: {
      conversationId: string;
      senderId: string;
      senderType: 'customer' | 'vendor';
      message: string;
    }) => {
      try {
        // Save message to database
        const result = await chatService.sendMessage(data);

        // Emit the new message to everyone in the conversation room
        io.to(data.conversationId).emit('message:receive', {
          conversationId: data.conversationId,
          message: result.message,
          lastMessage: result.conversation.lastMessage,
          lastMessageTime: result.conversation.lastMessageTime
        });

        // Notify the receiver about new unread message
        const receiverId = data.senderType === 'customer' 
          ? result.conversation.vendorId 
          : result.conversation.customerId;

        // Send unread count update to receiver
        io.to(receiverId).emit('message:unread', {
          conversationId: data.conversationId,
          unreadCount: data.senderType === 'customer'
            ? result.conversation.unreadCount.vendor
            : result.conversation.unreadCount.customer
        });

      } catch (error) {
        // Send error back to sender
        socket.emit('message:error', {
          message: (error as Error).message
        });
      }
    });

    /**
     * Event: User is typing
     * Client sends: { conversationId, userId, userType }
     */
    socket.on('typing:start', (data: {
      conversationId: string;
      userId: string;
      userType: 'customer' | 'vendor';
    }) => {
      // Broadcast to others in the conversation (except sender)
      socket.to(data.conversationId).emit('typing:update', {
        conversationId: data.conversationId,
        userId: data.userId,
        userType: data.userType,
        isTyping: true
      });
    });

    /**
     * Event: User stopped typing
     */
    socket.on('typing:stop', (data: {
      conversationId: string;
      userId: string;
      userType: 'customer' | 'vendor';
    }) => {
      // Broadcast to others in the conversation
      socket.to(data.conversationId).emit('typing:update', {
        conversationId: data.conversationId,
        userId: data.userId,
        userType: data.userType,
        isTyping: false
      });
    });

    /**
     * Event: Mark messages as read
     * Client sends: { conversationId, userType }
     */
    socket.on('messages:markRead', async (data: {
      conversationId: string;
      userType: 'customer' | 'vendor';
    }) => {
      try {
        // Update read status in database
        await chatService.markMessagesAsRead(data.conversationId, data.userType);

        // Notify others in the conversation that messages were read
        socket.to(data.conversationId).emit('messages:read', {
          conversationId: data.conversationId,
          readBy: data.userType
        });

      } catch (error) {
        socket.emit('message:error', {
          message: (error as Error).message
        });
      }
    });

    /**
     * Event: User disconnects
     */
    socket.on('disconnect', () => {
      console.log('User disconnected:', socket.id);
      
      // Find and remove user from online users
      for (const [userId, socketId] of onlineUsers.entries()) {
        if (socketId === socket.id) {
          onlineUsers.delete(userId);
          
          // Notify others that this user is offline (optional)
          socket.broadcast.emit('user:status', {
            userId,
            status: 'offline'
          });
          
          break;
        }
      }
    });
  });
};

/**
 * Helper function to check if a user is online
 * @param userId - The user ID to check
 * @returns boolean - true if user is online
 */
export const isUserOnline = (userId: string): boolean => {
  return onlineUsers.has(userId);
};

/**
 * Helper function to get socket ID of a user
 * @param userId - The user ID
 * @returns Socket ID or undefined
 */
export const getUserSocketId = (userId: string): string | undefined => {
  return onlineUsers.get(userId);
};