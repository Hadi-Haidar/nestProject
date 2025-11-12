// src/user/dto/update-user-status.dto.ts

import { IsEnum, IsNotEmpty } from 'class-validator';

export class UpdateUserStatusDto {
  @IsEnum(['active', 'banned'])
  @IsNotEmpty()
  status: 'active' | 'banned';
}