// src/pharmacy-owner/pharmacy-owner.module.ts

import { Module } from '@nestjs/common';
import { PharmacyOwnerController } from './pharmacy-owner.controller';
import { PharmacyOwnerService } from './pharmacy-owner.service';
import { PharmacyOwnerAuthService } from './pharmacy-owner-auth.service';
import { PharmacyModule } from '../pharmacy/pharmacy.module';
import { NotificationModule } from '../notification/notification.module';

@Module({
  imports: [PharmacyModule, NotificationModule], // Import NotificationModule
  controllers: [PharmacyOwnerController],
  providers: [PharmacyOwnerService, PharmacyOwnerAuthService],
  exports: [PharmacyOwnerService, PharmacyOwnerAuthService],
})
export class PharmacyOwnerModule {}

