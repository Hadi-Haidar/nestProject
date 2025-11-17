// src/pharmacy-owner/dto/pharmacy-owner-login.dto.ts

import { IsEmail, IsNotEmpty, IsString, MinLength } from 'class-validator';

export class PharmacyOwnerLoginDto {
  @IsEmail()
  @IsNotEmpty()
  email: string;

  @IsString()
  @IsNotEmpty()
  @MinLength(6)
  password: string;
}

