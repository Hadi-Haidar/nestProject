// src/chat/dto/get-messages.dto.ts

import { IsOptional, IsString, IsNumber, Min } from 'class-validator';
import { Type } from 'class-transformer';

export class GetMessagesDto {
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(1)
  limit?: number = 50; // Default 50 messages per page

  @IsOptional()
  @IsString()
  lastMessageId?: string; // For cursor-based pagination
}

