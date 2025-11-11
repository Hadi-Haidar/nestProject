// src/medicine/medicine.module.ts

import { Module } from '@nestjs/common';
import { MedicineService } from './medicine.service';
import { MedicineController } from './medicine.controller';
import { FirebaseStorageService } from '../firebase/firebase-storage.service';

@Module({
  controllers: [MedicineController],
  providers: [MedicineService, FirebaseStorageService],
  exports: [MedicineService, FirebaseStorageService],
})
export class MedicineModule {}