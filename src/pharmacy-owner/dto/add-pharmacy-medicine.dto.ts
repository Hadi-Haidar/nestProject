// src/pharmacy-owner/dto/add-pharmacy-medicine.dto.ts

import { IsString, IsNotEmpty, IsEnum, IsOptional } from 'class-validator';

export class AddPharmacyMedicineDto {
  @IsString()
  @IsNotEmpty()
  medicineId: string;

  @IsEnum(['available', 'unavailable'])
  @IsOptional()
  status?: 'available' | 'unavailable';
}

