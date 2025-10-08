// chat.interface.ts
// This file defines the structure (types) of our chat data

import { Document } from 'mongoose';

// Interface for a single chat message
export interface IMessage {
  senderId: string;           // ID of the person sending the message
  senderType: 'customer' | 'vendor';  // Whether sender is customer or vendor
  message: string;            // The actual text message
  timestamp: Date;            // When the message was sent
  isRead: boolean;            // Has the message been read?
}

// Interface for a conversation between customer and vendor
export interface IConversation extends Document {
  customerId: string;         // ID of the customer
  vendorId: string;           // ID of the vendor
  productId?: string;         // Optional: if chat is about a specific product
  messages: IMessage[];       // Array of all messages in this conversation
  lastMessage: string;        // Preview of the last message sent
  lastMessageTime: Date;      // When the last message was sent
  unreadCount: {              // Count of unread messages
    customer: number;         // Unread messages for customer
    vendor: number;           // Unread messages for vendor
  };
  createdAt: Date;
  updatedAt: Date;
}

// Data structure for creating a new message
export interface ICreateMessageDTO {
  conversationId: string;
  senderId: string;
  senderType: 'customer' | 'vendor';
  message: string;
}

// Data structure for getting conversations list
export interface IGetConversationsDTO {
  userId: string;
  userType: 'customer' | 'vendor';
  page?: number;
  limit?: number;
}

// Data structure for starting a new conversation
export interface IStartConversationDTO {
  customerId: string;
  vendorId: string;
  productId?: string;
  initialMessage?: string;
}