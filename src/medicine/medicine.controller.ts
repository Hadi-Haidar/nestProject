// src/medicine/medicine.controller.ts

import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  UseInterceptors,
  UploadedFiles,
  Query,
  BadRequestException,
} from '@nestjs/common';
import { FileFieldsInterceptor } from '@nestjs/platform-express';
import { MedicineService } from './medicine.service';
import { CreateMedicineDto } from './dto/create-medicine.dto';
import { UpdateMedicineDto } from './dto/update-medicine.dto';

@Controller('admin/medicines')
export class MedicineController {
  constructor(private readonly medicineService: MedicineService) {}

  // ========================================
  // CREATE MEDICINE (with image uploads)
  // ========================================
  @Post()
  @UseInterceptors(
    FileFieldsInterceptor([
      { name: 'frontImage', maxCount: 1 },
      { name: 'backImage', maxCount: 1 },
    ]),
  )
  async create(
    @Body() createMedicineDto: CreateMedicineDto,
    @UploadedFiles()
    files: {
      frontImage?: Express.Multer.File[];
      backImage?: Express.Multer.File[];
    },
  ) {
    // Validate that both images are provided
    if (!files?.frontImage || !files?.backImage) {
      throw new BadRequestException('Both front and back images are required');
    }

    // TODO: Get admin ID from JWT token (for now using hardcoded)
    const adminId = 'admin-hardcoded-id';

    return this.medicineService.create(
      createMedicineDto,
      files.frontImage[0],
      files.backImage[0],
      adminId,
    );
  }

  // ========================================
  // GET ALL MEDICINES
  // ========================================
  @Get()
  async findAll(@Query('status') status?: 'available' | 'unavailable') {
    if (status) {
      return this.medicineService.findByStatus(status);
    }
    return this.medicineService.findAll();
  }

  // ========================================
  // SEARCH MEDICINES
  // ========================================
  @Get('search')
  async search(@Query('q') query: string) {
    if (!query) {
      throw new BadRequestException('Search query is required');
    }
    return this.medicineService.search(query);
  }

  // ========================================
  // GET MEDICINE BY ID
  // ========================================
  @Get(':id')
  async findOne(@Param('id') id: string) {
    return this.medicineService.findOne(id);
  }

  // ========================================
  // UPDATE MEDICINE (with optional image uploads)
  // ========================================
  @Patch(':id')
  @UseInterceptors(
    FileFieldsInterceptor([
      { name: 'frontImage', maxCount: 1 },
      { name: 'backImage', maxCount: 1 },
    ]),
  )
  async update(
    @Param('id') id: string,
    @Body() updateMedicineDto: UpdateMedicineDto,
    @UploadedFiles()
    files?: {
      frontImage?: Express.Multer.File[];
      backImage?: Express.Multer.File[];
    },
  ) {
    return this.medicineService.update(
      id,
      updateMedicineDto,
      files?.frontImage?.[0],
      files?.backImage?.[0],
    );
  }

  // ========================================
  // DELETE MEDICINE
  // ========================================
  @Delete(':id')
  async remove(@Param('id') id: string) {
    return this.medicineService.remove(id);
  }
}