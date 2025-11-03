import { Controller, Post, Body, HttpCode, HttpStatus } from '@nestjs/common';
import { AdminAuthService } from './admin-auth.service';
import { RegisterAdminDto, LoginAdminDto, AdminResponseDto } from './dto/admin-auth.dto';

@Controller('admin/auth')
export class AdminAuthController {
  constructor(private readonly adminAuthService: AdminAuthService) {}

  @Post('register')
  async register(@Body() registerDto: RegisterAdminDto): Promise<AdminResponseDto> {
    return await this.adminAuthService.register(registerDto);
  }

  @Post('login')
  @HttpCode(HttpStatus.OK)
  async login(@Body() loginDto: LoginAdminDto): Promise<AdminResponseDto> {
    return await this.adminAuthService.login(loginDto);
  }

  @Post('logout')
  @HttpCode(HttpStatus.OK)
  async logout(): Promise<{ message: string }> {
    return await this.adminAuthService.logout();
  }
}