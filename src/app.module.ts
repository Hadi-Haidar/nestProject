import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { FirebaseModule } from './firebase/firebase.module';
import { AdminAuthModule } from './admin/admin-auth.module';
import { PharmacyModule } from './pharmacy/pharmacy.module';
import { MedicineModule } from './medicine/medicine.module'; // ADD THIS

@Module({
  imports: [
    // Load environment variables
    ConfigModule.forRoot({
      isGlobal: true, // Makes ConfigModule available everywhere
      envFilePath: '.env',
    }),
    // Firebase Module
    FirebaseModule,
    // Admin Authentication Module
    AdminAuthModule,
    // Pharmacy Module
    PharmacyModule,
    // Medicine Module
    MedicineModule, // ADD THIS
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}