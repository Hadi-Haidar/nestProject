// src/chat/entities/conversation.entity.ts

export class Conversation {
  id: string;                           // Firestore document ID
  userId: string;                       // Reference to User
  pharmacyOwnerId: string;              // Reference to PharmacyOwner
  pharmacyId: string;                   // Reference to Pharmacy
  
  // Last message info for quick preview
  lastMessage: string;
  lastMessageType: 'text' | 'image' | 'text-image';
  lastMessageAt: Date;
  lastMessageSenderId: string;          // Who sent the last message
  lastMessageSenderType: 'user' | 'pharmacy-owner';
  
  // Unread message counts
  unreadCountUser: number;              // Unread count for user
  unreadCountPharmacyOwner: number;     // Unread count for pharmacy owner
  
  // Status
  status: 'active' | 'archived';        // Conversation status
  
  // Metadata
  createdAt: Date;
  updatedAt: Date;
}

