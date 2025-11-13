// src/pharmacy/pharmacy.module.ts

import { Module } from '@nestjs/common';
import { PharmacyController } from './pharmacy.controller';
import { PharmacyService } from './pharmacy.service';
import { FirebaseStorageService } from '../firebase/firebase-storage.service';

@Module({
  controllers: [PharmacyController],
  providers: [PharmacyService, FirebaseStorageService],
  exports: [PharmacyService],
})
export class PharmacyModule {}