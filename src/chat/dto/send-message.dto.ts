// src/chat/dto/send-message.dto.ts

import { IsNotEmpty, IsString, IsEnum, IsOptional } from 'class-validator';

export class SendMessageDto {
  @IsNotEmpty()
  @IsString()
  conversationId: string;

  @IsNotEmpty()
  @IsString()
  senderId: string;

  @IsNotEmpty()
  @IsEnum(['user', 'pharmacy-owner'])
  senderType: 'user' | 'pharmacy-owner';

  @IsOptional()
  @IsString()
  content?: string; // Optional if image is provided

  @IsOptional()
  @IsString()
  imageUrl?: string; // Optional if text is provided
}

