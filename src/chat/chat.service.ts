// src/chat/chat.service.ts

import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { FirebaseService } from '../firebase/firebase.service';
import { FirebaseStorageService } from '../firebase/firebase-storage.service';
import { Conversation } from './entities/conversation.entity';
import { Message } from './entities/message.entity';
import { CreateConversationDto } from './dto/create-conversation.dto';
import { SendMessageDto } from './dto/send-message.dto';
import { GetMessagesDto } from './dto/get-messages.dto';
import { MarkReadDto } from './dto/mark-read.dto';
import * as admin from 'firebase-admin';

@Injectable()
export class ChatService {
  private db: admin.firestore.Firestore;

  constructor(
    private firebaseService: FirebaseService,
    private firebaseStorageService: FirebaseStorageService,
  ) {
    this.db = this.firebaseService.getFirestore();
  }

  /**
   * Get or create a conversation between user and pharmacy owner
   * This ensures only one conversation exists per user-pharmacy pair
   */
  async getOrCreateConversation(dto: CreateConversationDto): Promise<Conversation> {
    try {
      // Check if conversation already exists
      const existingConversation = await this.db
        .collection('conversations')
        .where('userId', '==', dto.userId)
        .where('pharmacyOwnerId', '==', dto.pharmacyOwnerId)
        .limit(1)
        .get();

      if (!existingConversation.empty) {
        const doc = existingConversation.docs[0];
        return { id: doc.id, ...doc.data() } as Conversation;
      }

      // Create new conversation
      const newConversation: Omit<Conversation, 'id'> = {
        userId: dto.userId,
        pharmacyOwnerId: dto.pharmacyOwnerId,
        pharmacyId: dto.pharmacyId,
        lastMessage: '',
        lastMessageType: 'text',
        lastMessageAt: admin.firestore.FieldValue.serverTimestamp() as any,
        lastMessageSenderId: '',
        lastMessageSenderType: 'user',
        unreadCountUser: 0,
        unreadCountPharmacyOwner: 0,
        status: 'active',
        createdAt: admin.firestore.FieldValue.serverTimestamp() as any,
        updatedAt: admin.firestore.FieldValue.serverTimestamp() as any,
      };

      const docRef = await this.db.collection('conversations').add(newConversation);
      return { id: docRef.id, ...newConversation } as Conversation;
    } catch (error) {
      throw new BadRequestException(`Failed to get or create conversation: ${error.message}`);
    }
  }

  /**
   * Get all conversations for a user
   * Sorted by lastMessageAt (most recent first)
   */
  async getUserConversations(userId: string): Promise<Conversation[]> {
    try {
      const snapshot = await this.db
        .collection('conversations')
        .where('userId', '==', userId)
        .where('status', '==', 'active')
        .orderBy('lastMessageAt', 'desc')
        .limit(100) // Limit to last 100 conversations
        .get();

      return snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
      })) as Conversation[];
    } catch (error) {
      throw new BadRequestException(`Failed to get user conversations: ${error.message}`);
    }
  }

  /**
   * Get all conversations for a pharmacy owner
   * Sorted by lastMessageAt (most recent first)
   */
  async getPharmacyOwnerConversations(pharmacyOwnerId: string): Promise<Conversation[]> {
    try {
      const snapshot = await this.db
        .collection('conversations')
        .where('pharmacyOwnerId', '==', pharmacyOwnerId)
        .where('status', '==', 'active')
        .orderBy('lastMessageAt', 'desc')
        .limit(100) // Limit to last 100 conversations
        .get();

      return snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
      })) as Conversation[];
    } catch (error) {
      throw new BadRequestException(`Failed to get pharmacy owner conversations: ${error.message}`);
    }
  }

  /**
   * Get a single conversation by ID
   */
  async getConversation(conversationId: string): Promise<Conversation> {
    try {
      const doc = await this.db.collection('conversations').doc(conversationId).get();

      if (!doc.exists) {
        throw new NotFoundException('Conversation not found');
      }

      return { id: doc.id, ...doc.data() } as Conversation;
    } catch (error) {
      if (error instanceof NotFoundException) throw error;
      throw new BadRequestException(`Failed to get conversation: ${error.message}`);
    }
  }

  /**
   * Send a message in a conversation
   * This also updates the conversation's last message info
   */
  async sendMessage(dto: SendMessageDto, senderName: string): Promise<Message> {
    try {
      // Validate that either content or imageUrl is provided
      if (!dto.content && !dto.imageUrl) {
        throw new BadRequestException('Message must contain text or image');
      }

      // Determine message type
      let messageType: 'text' | 'image' | 'text-image';
      if (dto.content && dto.imageUrl) {
        messageType = 'text-image';
      } else if (dto.imageUrl) {
        messageType = 'image';
      } else {
        messageType = 'text';
      }

      const newMessage: Omit<Message, 'id'> = {
        conversationId: dto.conversationId,
        senderId: dto.senderId,
        senderType: dto.senderType,
        senderName: senderName,
        content: dto.content || '',
        type: messageType,
        status: 'sent',
        createdAt: admin.firestore.FieldValue.serverTimestamp() as any,
      };

      // Only add imageUrl if it exists
      if (dto.imageUrl) {
        newMessage.imageUrl = dto.imageUrl;
      }

      // Create message in Firestore
      const messageRef = await this.db.collection('messages').add(newMessage);

      // Update conversation's last message info
      await this.updateConversationLastMessage(
        dto.conversationId,
        dto.content || '[Image]',
        messageType,
        dto.senderId,
        dto.senderType,
      );

      return { id: messageRef.id, ...newMessage } as Message;
    } catch (error) {
      if (error instanceof BadRequestException) throw error;
      throw new BadRequestException(`Failed to send message: ${error.message}`);
    }
  }

  /**
   * Get messages for a conversation with pagination
   * Uses cursor-based pagination for efficiency
   */
  async getMessages(conversationId: string, dto: GetMessagesDto): Promise<Message[]> {
    try {
      let query = this.db
        .collection('messages')
        .where('conversationId', '==', conversationId)
        .orderBy('createdAt', 'desc')
        .limit(dto.limit || 50);

      // Cursor-based pagination
      if (dto.lastMessageId) {
        const lastDoc = await this.db.collection('messages').doc(dto.lastMessageId).get();
        if (lastDoc.exists) {
          query = query.startAfter(lastDoc);
        }
      }

      const snapshot = await query.get();

      return snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
      })) as Message[];
    } catch (error) {
      throw new BadRequestException(`Failed to get messages: ${error.message}`);
    }
  }

  /**
   * Mark all messages in a conversation as read for a user
   * Also resets the unread count
   */
  async markMessagesAsRead(dto: MarkReadDto): Promise<{ success: boolean; markedCount: number }> {
    try {
      // Get all unread messages for this reader in this conversation
      const snapshot = await this.db
        .collection('messages')
        .where('conversationId', '==', dto.conversationId)
        .where('status', '!=', 'read')
        .get();

      // Filter messages not sent by the reader (can't mark own messages as read)
      const messagesToMark = snapshot.docs.filter(
        doc => doc.data().senderId !== dto.readerId
      );

      // Batch update for performance
      const batch = this.db.batch();

      messagesToMark.forEach(doc => {
        batch.update(doc.ref, {
          status: 'read',
          readAt: admin.firestore.FieldValue.serverTimestamp(),
        });
      });

      // Update conversation unread count
      const conversationRef = this.db.collection('conversations').doc(dto.conversationId);
      const unreadField = dto.readerType === 'user' ? 'unreadCountUser' : 'unreadCountPharmacyOwner';
      batch.update(conversationRef, {
        [unreadField]: 0,
      });

      await batch.commit();

      return { success: true, markedCount: messagesToMark.length };
    } catch (error) {
      throw new BadRequestException(`Failed to mark messages as read: ${error.message}`);
    }
  }

  /**
   * Upload image for chat message
   */
  async uploadChatImage(file: Express.Multer.File): Promise<string> {
    try {
      // Validate file type
      const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'];
      if (!allowedTypes.includes(file.mimetype)) {
        throw new BadRequestException('Only image files are allowed (jpeg, jpg, png, gif, webp)');
      }

      // Validate file size (max 5MB)
      const maxSize = 5 * 1024 * 1024; // 5MB
      if (file.size > maxSize) {
        throw new BadRequestException('Image size must be less than 5MB');
      }

      // Upload to Firebase Storage
      const imageUrl = await this.firebaseStorageService.uploadImage(file, 'chat-images');
      return imageUrl;
    } catch (error) {
      if (error instanceof BadRequestException) throw error;
      throw new BadRequestException(`Failed to upload image: ${error.message}`);
    }
  }

  /**
   * Private helper: Update conversation's last message info
   */
  private async updateConversationLastMessage(
    conversationId: string,
    lastMessage: string,
    lastMessageType: 'text' | 'image' | 'text-image',
    senderId: string,
    senderType: 'user' | 'pharmacy-owner',
  ): Promise<void> {
    try {
      const unreadField = senderType === 'user' ? 'unreadCountPharmacyOwner' : 'unreadCountUser';

      await this.db.collection('conversations').doc(conversationId).update({
        lastMessage: lastMessage,
        lastMessageType: lastMessageType,
        lastMessageAt: admin.firestore.FieldValue.serverTimestamp(),
        lastMessageSenderId: senderId,
        lastMessageSenderType: senderType,
        [unreadField]: admin.firestore.FieldValue.increment(1),
        updatedAt: admin.firestore.FieldValue.serverTimestamp(),
      });
    } catch (error) {
      console.error('Failed to update conversation last message:', error);
      // Don't throw error, message was already sent
    }
  }

  /**
   * Archive a conversation (soft delete)
   */
  async archiveConversation(conversationId: string): Promise<{ success: boolean }> {
    try {
      await this.db.collection('conversations').doc(conversationId).update({
        status: 'archived',
        updatedAt: admin.firestore.FieldValue.serverTimestamp(),
      });

      return { success: true };
    } catch (error) {
      throw new BadRequestException(`Failed to archive conversation: ${error.message}`);
    }
  }
}

