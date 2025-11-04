import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { FirebaseModule } from './firebase/firebase.module';
import { AdminAuthModule } from './admin/admin-auth.module';
import { PharmacyModule } from './pharmacy/pharmacy.module';

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
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}