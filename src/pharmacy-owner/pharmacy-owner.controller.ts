// src/pharmacy-owner/pharmacy-owner.controller.ts

import {
  Controller,
  Post,
  Get,
  Patch,
  Delete,
  Body,
  Param,
  Query,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { PharmacyOwnerAuthService } from './pharmacy-owner-auth.service';
import { PharmacyOwnerService } from './pharmacy-owner.service';
import { PharmacyOwnerLoginDto } from './dto/pharmacy-owner-login.dto';
import { AddPharmacyMedicineDto } from './dto/add-pharmacy-medicine.dto';
import { UpdatePharmacyMedicineDto } from './dto/update-pharmacy-medicine.dto';

@Controller('pharmacy-owner')
export class PharmacyOwnerController {
  constructor(
    private readonly authService: PharmacyOwnerAuthService,
    private readonly pharmacyOwnerService: PharmacyOwnerService,
  ) {}

  // ========================================
  // AUTHENTICATION
  // ========================================

  /**
   * POST /pharmacy-owner/login
   * Login for pharmacy owners
   */
  @Post('login')
  @HttpCode(HttpStatus.OK)
  async login(@Body() loginDto: PharmacyOwnerLoginDto) {
    return await this.authService.login(loginDto.email, loginDto.password);
  }

  // ========================================
  // MEDICINES MANAGEMENT
  // ========================================

  /**
   * GET /pharmacy-owner/medicines/all
   * Get all medicines available from admin (to add to pharmacy)
   */
  @Get('medicines/all')
  async getAllAvailableMedicines() {
    return await this.pharmacyOwnerService.getAllAvailableMedicines();
  }

  /**
   * GET /pharmacy-owner/pharmacy/:pharmacyId/medicines/available
   * Get medicines that owner can still add to their pharmacy
   */
  @Get('pharmacy/:pharmacyId/medicines/available')
  async getAvailableMedicinesToAdd(
    @Param('pharmacyId') pharmacyId: string,
    @Body('ownerId') ownerId: string, // In real app, get from JWT token
  ) {
    return await this.pharmacyOwnerService.getAvailableMedicinesToAdd(
      pharmacyId,
      ownerId,
    );
  }

  /**
   * GET /pharmacy-owner/pharmacy/:pharmacyId/medicines
   * Get all medicines for a specific pharmacy
   */
  @Get('pharmacy/:pharmacyId/medicines')
  async getPharmacyMedicines(
    @Param('pharmacyId') pharmacyId: string,
    @Query('ownerId') ownerId: string, // In real app, get from JWT token
  ) {
    return await this.pharmacyOwnerService.getPharmacyMedicines(
      pharmacyId,
      ownerId,
    );
  }

  /**
   * POST /pharmacy-owner/pharmacy/:pharmacyId/medicines
   * Add a medicine to pharmacy's inventory
   */
  @Post('pharmacy/:pharmacyId/medicines')
  async addMedicineToPharmacy(
    @Param('pharmacyId') pharmacyId: string,
    @Body('ownerId') ownerId: string, // In real app, get from JWT token
    @Body() addMedicineDto: AddPharmacyMedicineDto,
  ) {
    return await this.pharmacyOwnerService.addMedicineToPharmacy(
      pharmacyId,
      ownerId,
      addMedicineDto,
    );
  }

  /**
   * PATCH /pharmacy-owner/pharmacy/:pharmacyId/medicines/:medicineId
   * Update medicine availability status (available/unavailable)
   */
  @Patch('pharmacy/:pharmacyId/medicines/:medicineId')
  async updateMedicineStatus(
    @Param('pharmacyId') pharmacyId: string,
    @Param('medicineId') medicineId: string,
    @Body('ownerId') ownerId: string, // In real app, get from JWT token
    @Body() updateDto: UpdatePharmacyMedicineDto,
  ) {
    return await this.pharmacyOwnerService.updateMedicineStatus(
      medicineId,
      pharmacyId,
      ownerId,
      updateDto,
    );
  }

  /**
   * DELETE /pharmacy-owner/pharmacy/:pharmacyId/medicines/:medicineId
   * Remove a medicine from pharmacy's inventory
   */
  @Delete('pharmacy/:pharmacyId/medicines/:medicineId')
  async removeMedicineFromPharmacy(
    @Param('pharmacyId') pharmacyId: string,
    @Param('medicineId') medicineId: string,
    @Body('ownerId') ownerId: string, // In real app, get from JWT token
  ) {
    return await this.pharmacyOwnerService.removeMedicineFromPharmacy(
      medicineId,
      pharmacyId,
      ownerId,
    );
  }
}

