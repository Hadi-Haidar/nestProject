// src/chat/dto/mark-read.dto.ts

import { IsNotEmpty, IsString, IsEnum } from 'class-validator';

export class MarkReadDto {
  @IsNotEmpty()
  @IsString()
  conversationId: string;

  @IsNotEmpty()
  @IsString()
  readerId: string; // userId or pharmacyOwnerId

  @IsNotEmpty()
  @IsEnum(['user', 'pharmacy-owner'])
  readerType: 'user' | 'pharmacy-owner';
}

