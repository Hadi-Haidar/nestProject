// src/pharmacy/dto/update-pharmacy.dto.ts
import { PartialType, OmitType } from '@nestjs/mapped-types';
import { CreatePharmacyDto } from './create-pharmacy.dto';
import { IsString, IsEmail, IsOptional, MinLength } from 'class-validator';

// Omit owner fields from CreatePharmacyDto and make them optional with custom validation
export class UpdatePharmacyDto extends PartialType(
  OmitType(CreatePharmacyDto, ['ownerEmail', 'ownerPassword'] as const)
) {
  // Make owner email optional for updates
  @IsEmail()
  @IsOptional()
  ownerEmail?: string;

  // Make owner password optional for updates, but validate if provided
  @IsString()
  @MinLength(6)
  @IsOptional()
  ownerPassword?: string;
}