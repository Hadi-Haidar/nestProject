// src/pharmacy-owner/pharmacy-owner.module.ts

import { Module } from '@nestjs/common';
import { PharmacyOwnerController } from './pharmacy-owner.controller';
import { PharmacyOwnerService } from './pharmacy-owner.service';
import { PharmacyOwnerAuthService } from './pharmacy-owner-auth.service';
import { PharmacyModule } from '../pharmacy/pharmacy.module';

@Module({
  imports: [PharmacyModule], // Import PharmacyModule to use PharmacyService
  controllers: [PharmacyOwnerController],
  providers: [PharmacyOwnerService, PharmacyOwnerAuthService],
  exports: [PharmacyOwnerService, PharmacyOwnerAuthService],
})
export class PharmacyOwnerModule {}

