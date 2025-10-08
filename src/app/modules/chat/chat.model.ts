// chat.model.ts
// This file defines the database schema for conversations and messages

import mongoose, { Schema } from 'mongoose';
import { IConversation, IMessage } from './chat.interface';

// Schema for individual messages within a conversation
const MessageSchema = new Schema<IMessage>({
  senderId: {
    type: String,
    required: true,
    trim: true
  },
  senderType: {
    type: String,
    enum: ['customer', 'vendor'],  // Can only be customer or vendor
    required: true
  },
  message: {
    type: String,
    required: true,
    trim: true
  },
  timestamp: {
    type: Date,
    default: Date.now  // Automatically set to current time
  },
  isRead: {
    type: Boolean,
    default: false  // Messages start as unread
  }
}, { _id: true });  // Each message gets its own ID

// Schema for the conversation between customer and vendor
const ConversationSchema = new Schema<IConversation>({
  customerId: {
    type: String,
    required: true,
    trim: true,
    index: true  // Index for faster queries
  },
  vendorId: {
    type: String,
    required: true,
    trim: true,
    index: true  // Index for faster queries
  },
  productId: {
    type: String,
    trim: true,
    default: null  // Optional field
  },
  messages: {
    type: [MessageSchema],  // Array of messages
    default: []
  },
  lastMessage: {
    type: String,
    default: ''
  },
  lastMessageTime: {
    type: Date,
    default: Date.now
  },
  unreadCount: {
    customer: {
      type: Number,
      default: 0
    },
    vendor: {
      type: Number,
      default: 0
    }
  }
}, {
  timestamps: true  // Automatically creates createdAt and updatedAt fields
});

// Compound index for finding conversations between specific customer and vendor
ConversationSchema.index({ customerId: 1, vendorId: 1 });

// Index for sorting conversations by last message time
ConversationSchema.index({ lastMessageTime: -1 });

// Create and export the Conversation model
const Conversation = mongoose.model<IConversation>('Conversation', ConversationSchema);

export default Conversation;