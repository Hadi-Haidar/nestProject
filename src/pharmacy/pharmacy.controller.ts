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
  BadRequestException,
  NotFoundException,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { PharmacyService } from './pharmacy.service';
import { CreatePharmacyDto } from './dto/create-pharmacy.dto';
import { UpdatePharmacyDto } from './dto/update-pharmacy.dto';

@Controller('admin/pharmacies')
export class PharmacyController {
  constructor(private readonly pharmacyService: PharmacyService) {}

  // Upload pharmacy image
  @Post('upload-image')
  @UseInterceptors(FileInterceptor('image'))
  async uploadImage(
    @UploadedFile(
      new ParseFilePipe({
        validators: [
          new MaxFileSizeValidator({ maxSize: 5 * 1024 * 1024 }),
        ],
      }),
    )
    file: Express.Multer.File,
  ) {
    // Manual validation for image types
    const allowedMimeTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
    if (!allowedMimeTypes.includes(file.mimetype)) {
      throw new BadRequestException(
        `Invalid file type. Allowed types: ${allowedMimeTypes.join(', ')}`
      );
    }

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
  ) {
    const adminId = 'admin-123';
    return this.pharmacyService.create(createPharmacyDto, adminId);
  }

  // Get all pharmacies
  @Get()
  async findAll(@Query('status') status?: 'active' | 'inactive') {
    if (status) {
      return this.pharmacyService.findByStatus(status);
    }
    // Return pharmacies with owner details for admin panel
    return this.pharmacyService.findAllWithOwners();
  }

  // Search pharmacies
  @Get('search')
  async search(@Query('q') query: string) {
    return this.pharmacyService.search(query);
  }

  // Get all pharmacy owners
  @Get('owners/all')
  async getAllOwners() {
    return this.pharmacyService.findAllOwners();
  }

  // Get a specific owner by ID
  @Get('owners/:id')
  async getOwnerById(@Param('id') id: string) {
    const owner = await this.pharmacyService.findOwnerById(id);
    if (!owner) {
      throw new NotFoundException(`Owner with ID ${id} not found`);
    }
    return owner;
  }

  // Get pharmacy by ID
  @Get(':id')
  async findOne(@Param('id') id: string) {
    // Return pharmacy with owner details for admin panel
    return this.pharmacyService.findOneWithOwner(id);
  }

  // Update pharmacy
  @Patch(':id')
  @UseInterceptors(FileInterceptor('image'))
  async update(
    @Param('id') id: string,
    @Body() updatePharmacyDto: UpdatePharmacyDto,
    @UploadedFile(
      new ParseFilePipe({
        validators: [
          new MaxFileSizeValidator({ maxSize: 5 * 1024 * 1024 }),
        ],
        fileIsRequired: false,
      }),
    )
    file?: Express.Multer.File,
  ) {
    // Manual validation for image types (if file provided)
    if (file) {
      const allowedMimeTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
      if (!allowedMimeTypes.includes(file.mimetype)) {
        throw new BadRequestException(
          `Invalid file type. Allowed types: ${allowedMimeTypes.join(', ')}`
        );
      }
    }

    return this.pharmacyService.update(id, updatePharmacyDto, file);
  }

  // Delete pharmacy
  @Delete(':id')
  @HttpCode(HttpStatus.OK)
  async remove(@Param('id') id: string) {
    return this.pharmacyService.remove(id);
  }
}