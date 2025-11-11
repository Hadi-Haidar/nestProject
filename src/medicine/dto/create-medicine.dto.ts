// src/medicine/dto/create-medicine.dto.ts

import { IsString, IsNotEmpty, MinLength, IsOptional, IsEnum } from 'class-validator';

export class CreateMedicineDto {
  @IsString()
  @IsNotEmpty()
  @MinLength(3)
  title: string;

  @IsString()
  @IsNotEmpty()
  @MinLength(10)
  description: string;

  @IsOptional()
  @IsEnum(['available', 'unavailable'])
  status?: 'available' | 'unavailable';
}