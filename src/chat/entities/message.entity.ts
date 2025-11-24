// src/chat/entities/message.entity.ts

export class Message {
  id: string;                           // Firestore document ID
  conversationId: string;               // Reference to Conversation (INDEXED)
  
  // Sender information
  senderId: string;                     // userId or pharmacyOwnerId
  senderType: 'user' | 'pharmacy-owner';
  senderName: string;                   // Cached for display
  
  // Message content
  content: string;                      // Text message (can be empty if image-only)
  imageUrl?: string;                    // Optional image URL
  type: 'text' | 'image' | 'text-image'; // Message type
  
  // Message status
  status: 'sent' | 'delivered' | 'read';
  deliveredAt?: Date;
  readAt?: Date;
  
  // Timestamps
  createdAt: Date;                      // INDEXED for sorting
}

