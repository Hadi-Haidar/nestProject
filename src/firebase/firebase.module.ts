import { Module, Global } from '@nestjs/common';
import { FirebaseService } from './firebase.service';

@Global() // This makes FirebaseService available everywhere
@Module({
  providers: [FirebaseService],
  exports: [FirebaseService],
})
export class FirebaseModule {}