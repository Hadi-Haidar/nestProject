// src/chat/dto/create-conversation.dto.ts

import { IsNotEmpty, IsString } from 'class-validator';

export class CreateConversationDto {
  @IsNotEmpty()
  @IsString()
  userId: string;

  @IsNotEmpty()
  @IsString()
  pharmacyOwnerId: string;

  @IsNotEmpty()
  @IsString()
  pharmacyId: string;
}

