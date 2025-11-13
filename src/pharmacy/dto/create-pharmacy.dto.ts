// src/pharmacy/dto/create-pharmacy.dto.ts

import { IsString, IsEmail, IsNumber, IsArray, IsBoolean, IsOptional, MinLength, ValidateNested, IsEnum } from 'class-validator';
import { Type } from 'class-transformer';

class LocationDto {
  @IsNumber()
  latitude: number;

  @IsNumber()
  longitude: number;

  @IsString()
  @IsOptional()
  address?: string;
}

class WorkingHourDto {
  @IsString()
  day: string; // Monday, Tuesday, etc.

  @IsBoolean()
  isOpen: boolean;

  @IsString()
  @IsOptional()
  openTime?: string; // Format: "HH:mm" like "08:00"

  @IsString()
  @IsOptional()
  closeTime?: string; // Format: "HH:mm" like "20:00"
}

export class CreatePharmacyDto {
  @IsString()
  @MinLength(3)
  title: string;

  @IsString()
  @MinLength(10)
  description: string;

  // Image will be uploaded via separate endpoint, so this is optional now
  @IsString()
  @IsOptional()
  imageUrl?: string;

  @ValidateNested()
  @Type(() => LocationDto)
  location: LocationDto;

  @IsEmail()
  ownerEmail: string;

  @IsString()
  @MinLength(6)
  ownerPassword: string;

  @IsString()
  @IsOptional()
  ownerName?: string;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => WorkingHourDto)
  workingHours: WorkingHourDto[];

  @IsEnum(['active', 'inactive'])
  @IsOptional()
  status?: 'active' | 'inactive';
}