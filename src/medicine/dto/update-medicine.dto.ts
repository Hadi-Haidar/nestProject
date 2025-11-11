// src/medicine/dto/update-medicine.dto.ts

import { IsString, IsOptional, MinLength, IsEnum } from 'class-validator';

export class UpdateMedicineDto {
  @IsOptional()
  @IsString()
  @MinLength(3)
  title?: string;

  @IsOptional()
  @IsString()
  @MinLength(10)
  description?: string;

  @IsOptional()
  @IsEnum(['available', 'unavailable'])
  status?: 'available' | 'unavailable';
}