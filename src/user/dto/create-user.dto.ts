// src/user/dto/create-user.dto.ts

import { IsString, IsNotEmpty, IsEmail, MinLength, IsOptional, IsObject } from 'class-validator';

export class CreateUserDto {
  @IsString()
  @IsNotEmpty()
  @MinLength(3)
  name: string;

  @IsEmail()
  @IsNotEmpty()
  email: string;

  @IsString()
  @IsNotEmpty()
  @MinLength(6)
  password: string;

  @IsOptional()
  @IsObject()
  location?: {
    latitude: number;
    longitude: number;
    address?: string;
  };
}