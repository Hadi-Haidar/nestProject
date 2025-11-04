// src/pharmacy/dto/update-pharmacy.dto.ts
import { PartialType } from '@nestjs/mapped-types';
import { CreatePharmacyDto } from './create-pharmacy.dto';

export class UpdatePharmacyDto extends PartialType(CreatePharmacyDto) {
  // All fields are optional for updates
}