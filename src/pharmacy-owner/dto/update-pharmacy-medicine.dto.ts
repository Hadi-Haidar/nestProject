// src/pharmacy-owner/dto/update-pharmacy-medicine.dto.ts

import { IsEnum, IsNotEmpty } from 'class-validator';

export class UpdatePharmacyMedicineDto {
  @IsEnum(['available', 'unavailable'])
  @IsNotEmpty()
  status: 'available' | 'unavailable';
}

