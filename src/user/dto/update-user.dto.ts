// src/user/dto/update-user.dto.ts

import { IsString, IsEmail, IsOptional, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';

class LocationDto {
  @IsOptional()
  latitude?: number;

  @IsOptional()
  longitude?: number;
}

export class UpdateUserDto {
  @IsString()
  @IsOptional()
  name?: string;

  @IsEmail()
  @IsOptional()
  email?: string;

  @ValidateNested()
  @Type(() => LocationDto)
  @IsOptional()
  location?: LocationDto;
}
