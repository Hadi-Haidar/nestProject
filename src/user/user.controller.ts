// src/user/user.controller.ts

import {
    Controller,
    Get,
    Post,
    Body,
    Patch,
    Param,
    Delete,
    Query,
    BadRequestException,
  } from '@nestjs/common';
  import { UserService } from './user.service';
  import { CreateUserDto } from './dto/create-user.dto';
  import { UpdateUserStatusDto } from './dto/update-user-status.dto';
  
  @Controller('admin/users')
  export class UserController {
    constructor(private readonly userService: UserService) {}
  
    // ========================================
    // CREATE USER (For Testing Only)
    // ========================================
    @Post()
    async create(@Body() createUserDto: CreateUserDto) {
      return this.userService.create(createUserDto);
    }
  
    // ========================================
    // GET ALL USERS (with optional filters)
    // ========================================
    @Get()
    async findAll(@Query('status') status?: 'active' | 'banned') {
      if (status) {
        return this.userService.findByStatus(status);
      }
      return this.userService.findAll();
    }
  
    // ========================================
    // GET USER STATISTICS
    // ========================================
    @Get('statistics')
    async getStatistics() {
      return this.userService.getStatistics();
    }
  
    // ========================================
    // SEARCH USERS
    // ========================================
    @Get('search')
    async search(@Query('q') query: string) {
      if (!query) {
        throw new BadRequestException('Search query is required');
      }
      return this.userService.search(query);
    }
  
    // ========================================
    // GET USER BY ID
    // ========================================
    @Get(':id')
    async findOne(@Param('id') id: string) {
      return this.userService.findOne(id);
    }
  
    // ========================================
    // UPDATE USER STATUS (Ban/Unban)
    // ========================================
    @Patch(':id/status')
    async updateStatus(
      @Param('id') id: string,
      @Body() updateUserStatusDto: UpdateUserStatusDto,
    ) {
      return this.userService.updateStatus(id, updateUserStatusDto);
    }
  
    // ========================================
    // DELETE USER
    // ========================================
    @Delete(':id')
    async remove(@Param('id') id: string) {
      return this.userService.remove(id);
    }
  }