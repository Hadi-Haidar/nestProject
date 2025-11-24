// src/chat/chat.controller.ts

import {
  Controller,
  Get,
  Post,
  Patch,
  Body,
  Param,
  Query,
  UseInterceptors,
  UploadedFile,
  BadRequestException,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { ChatService } from './chat.service';
import { CreateConversationDto } from './dto/create-conversation.dto';
import { SendMessageDto } from './dto/send-message.dto';
import { GetMessagesDto } from './dto/get-messages.dto';
import { MarkReadDto } from './dto/mark-read.dto';

@Controller('chat')
export class ChatController {
  constructor(private readonly chatService: ChatService) {}

  /**
   * POST /chat/conversations
   * Get or create a conversation between user and pharmacy owner
   * 
   * Body: { userId, pharmacyOwnerId, pharmacyId }
   * Returns: Conversation object
   */
  @Post('conversations')
  async getOrCreateConversation(@Body() dto: CreateConversationDto) {
    return this.chatService.getOrCreateConversation(dto);
  }

  /**
   * GET /chat/conversations/user/:userId
   * Get all conversations for a user
   * 
   * Returns: Array of Conversation objects
   */
  @Get('conversations/user/:userId')
  async getUserConversations(@Param('userId') userId: string) {
    return this.chatService.getUserConversations(userId);
  }

  /**
   * GET /chat/conversations/pharmacy-owner/:pharmacyOwnerId
   * Get all conversations for a pharmacy owner
   * 
   * Returns: Array of Conversation objects
   */
  @Get('conversations/pharmacy-owner/:pharmacyOwnerId')
  async getPharmacyOwnerConversations(@Param('pharmacyOwnerId') pharmacyOwnerId: string) {
    return this.chatService.getPharmacyOwnerConversations(pharmacyOwnerId);
  }

  /**
   * GET /chat/conversations/:id
   * Get a single conversation by ID
   * 
   * Returns: Conversation object
   */
  @Get('conversations/:id')
  async getConversation(@Param('id') id: string) {
    return this.chatService.getConversation(id);
  }

  /**
   * POST /chat/messages
   * Send a message in a conversation
   * 
   * Body: { conversationId, senderId, senderType, content?, imageUrl? }
   * Returns: Message object
   */
  @Post('messages')
  async sendMessage(
    @Body() dto: SendMessageDto,
    @Body('senderName') senderName?: string,
  ) {
    // You should get senderName from the authenticated user's data
    // For now, we'll accept it from the request body
    const name = senderName || 'Unknown User';
    return this.chatService.sendMessage(dto, name);
  }

  /**
   * GET /chat/conversations/:conversationId/messages
   * Get messages for a conversation with pagination
   * 
   * Query params: limit (default 50), lastMessageId (for pagination)
   * Returns: Array of Message objects
   */
  @Get('conversations/:conversationId/messages')
  async getMessages(
    @Param('conversationId') conversationId: string,
    @Query() dto: GetMessagesDto,
  ) {
    return this.chatService.getMessages(conversationId, dto);
  }

  /**
   * PATCH /chat/messages/mark-read
   * Mark all messages in a conversation as read for a user
   * 
   * Body: { conversationId, readerId, readerType }
   * Returns: { success: boolean, markedCount: number }
   */
  @Patch('messages/mark-read')
  async markMessagesAsRead(@Body() dto: MarkReadDto) {
    return this.chatService.markMessagesAsRead(dto);
  }

  /**
   * POST /chat/upload-image
   * Upload an image for a chat message
   * 
   * Form-data: image (file)
   * Returns: { imageUrl: string }
   */
  @Post('upload-image')
  @UseInterceptors(FileInterceptor('image'))
  async uploadChatImage(@UploadedFile() file: Express.Multer.File) {
    if (!file) {
      throw new BadRequestException('No image file provided');
    }

    const imageUrl = await this.chatService.uploadChatImage(file);
    return { imageUrl };
  }

  /**
   * PATCH /chat/conversations/:id/archive
   * Archive a conversation (soft delete)
   * 
   * Returns: { success: boolean }
   */
  @Patch('conversations/:id/archive')
  async archiveConversation(@Param('id') id: string) {
    return this.chatService.archiveConversation(id);
  }
}

