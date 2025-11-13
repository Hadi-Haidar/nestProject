// src/export/export.controller.ts - FINAL FIX

import { Controller, Get, Res } from '@nestjs/common';
import { ExportService } from './export.service';

@Controller('admin/export')
export class ExportController {
  constructor(private readonly exportService: ExportService) {}

  // ========================================
  // EXPORT MEDICINES TO EXCEL
  // ========================================
  @Get('medicines')
  async exportMedicines(@Res() res: any): Promise<void> {
    try {
      const buffer = await this.exportService.exportMedicines();

      res.setHeader(
        'Content-Type',
        'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      );
      res.setHeader(
        'Content-Disposition',
        `attachment; filename=medicines-${Date.now()}.xlsx`,
      );

      res.send(buffer);
    } catch (error) {
      console.error('Export medicines error:', error);
      res.status(500).json({ message: 'Failed to export medicines' });
    }
  }

  // ========================================
  // EXPORT PHARMACY OWNERS TO EXCEL
  // ========================================
  @Get('pharmacy-owners')
  async exportPharmacyOwners(@Res() res: any): Promise<void> {
    try {
      const buffer = await this.exportService.exportPharmacyOwners();

      res.setHeader(
        'Content-Type',
        'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      );
      res.setHeader(
        'Content-Disposition',
        `attachment; filename=pharmacy-owners-${Date.now()}.xlsx`,
      );

      res.send(buffer);
    } catch (error) {
      console.error('Export pharmacy owners error:', error);
      res.status(500).json({ message: 'Failed to export pharmacy owners' });
    }
  }

  // ========================================
  // EXPORT PHARMACIES TO EXCEL
  // ========================================
  @Get('pharmacies')
  async exportPharmacies(@Res() res: any): Promise<void> {
    try {
      const buffer = await this.exportService.exportPharmacies();

      res.setHeader(
        'Content-Type',
        'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      );
      res.setHeader(
        'Content-Disposition',
        `attachment; filename=pharmacies-${Date.now()}.xlsx`,
      );

      res.send(buffer);
    } catch (error) {
      console.error('Export pharmacies error:', error);
      res.status(500).json({ message: 'Failed to export pharmacies' });
    }
  }
}