// src/firebase/firebase.module.ts

import { Module, Global } from '@nestjs/common';
import { FirebaseService } from './firebase.service';
import { FirebaseStorageService } from './firebase-storage.service';

@Global() // This makes both services available everywhere
@Module({
  providers: [FirebaseService, FirebaseStorageService],
  exports: [FirebaseService, FirebaseStorageService],
})
export class FirebaseModule {}