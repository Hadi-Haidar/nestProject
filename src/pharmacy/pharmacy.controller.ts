// src/pharmacy/pharmacy.controller.ts
import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  Query,
  HttpCode,
  HttpStatus,
  UseInterceptors,
  UploadedFile,
  ParseFilePipe,
  MaxFileSizeValidator,
  FileTypeValidator,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { PharmacyService } from './pharmacy.service';
import { CreatePharmacyDto } from './dto/create-pharmacy.dto';
import { UpdatePharmacyDto } from './dto/update-pharmacy.dto';

@Controller('admin/pharmacies')
export class PharmacyController {
  constructor(private readonly pharmacyService: PharmacyService) {}

  // Upload pharmacy image (separate endpoint before creating pharmacy)
  @Post('upload-image')
  @UseInterceptors(FileInterceptor('image'))
  async uploadImage(
    @UploadedFile(
      new ParseFilePipe({
        validators: [
          new MaxFileSizeValidator({ maxSize: 5 * 1024 * 1024 }), // 5MB max
          new FileTypeValidator({ fileType: /(jpg|jpeg|png|webp)$/ }),
        ],
      }),
    )
    file: Express.Multer.File,
  ) {
    const imageUrl = await this.pharmacyService.uploadPharmacyImage(file);
    return {
      message: 'Image uploaded successfully',
      imageUrl,
    };
  }

  // Create new pharmacy
  @Post()
  @HttpCode(HttpStatus.CREATED)
  async create(
    @Body() createPharmacyDto: CreatePharmacyDto,
    // TODO: Get admin ID from JWT token after implementing auth guard
    // @Request() req,
  ) {
    // For now, using a placeholder admin ID
    const adminId = 'admin-123'; // Replace with actual admin ID from JWT
    return this.pharmacyService.create(createPharmacyDto, adminId);
  }

  // Get all pharmacies
  @Get()
  async findAll(@Query('status') status?: 'active' | 'inactive') {
    if (status) {
      return this.pharmacyService.findByStatus(status);
    }
    return this.pharmacyService.findAll();
  }

  // Search pharmacies
  @Get('search')
  async search(@Query('q') query: string) {
    return this.pharmacyService.search(query);
  }

  // Get pharmacy by ID
  @Get(':id')
  async findOne(@Param('id') id: string) {
    return this.pharmacyService.findOne(id);
  }

  // Update pharmacy (with optional image upload)
  @Patch(':id')
  @UseInterceptors(FileInterceptor('image'))
  async update(
    @Param('id') id: string,
    @Body() updatePharmacyDto: UpdatePharmacyDto,
    @UploadedFile(
      new ParseFilePipe({
        validators: [
          new MaxFileSizeValidator({ maxSize: 5 * 1024 * 1024 }),
          new FileTypeValidator({ fileType: /(jpg|jpeg|png|webp)$/ }),
        ],
        fileIsRequired: false, // Make file optional for updates
      }),
    )
    file?: Express.Multer.File,
  ) {
    return this.pharmacyService.update(id, updatePharmacyDto, file);
  }

  // Delete pharmacy
  @Delete(':id')
  @HttpCode(HttpStatus.OK)
  async remove(@Param('id') id: string) {
    return this.pharmacyService.remove(id);
  }
}