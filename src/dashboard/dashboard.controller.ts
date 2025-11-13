// src/dashboard/dashboard.controller.ts

import { Controller, Get } from '@nestjs/common';
import { DashboardService } from './dashboard.service';

@Controller('admin/dashboard')
export class DashboardController {
  constructor(private readonly dashboardService: DashboardService) {}

  /**
   * GET /admin/dashboard/stats
   * Get comprehensive dashboard statistics
   */
  @Get('stats')
  async getStats() {
    return this.dashboardService.getStats();
  }

  /**
   * GET /admin/dashboard/user-growth
   * Get user growth data for the last 12 months
   */
  @Get('user-growth')
  async getUserGrowthData() {
    return this.dashboardService.getUserGrowthData();
  }

  /**
   * GET /admin/dashboard/pharmacy-trend
   * Get pharmacy registration trend for the last 12 months
   */
  @Get('pharmacy-trend')
  async getPharmacyTrendData() {
    return this.dashboardService.getPharmacyTrendData();
  }

  /**
   * GET /admin/dashboard/user-activity
   * Get user activity data for the last 7 days
   */
  @Get('user-activity')
  async getUserActivityData() {
    return this.dashboardService.getUserActivityData();
  }

  /**
   * GET /admin/dashboard/pharmacy-status
   * Get pharmacy status distribution
   */
  @Get('pharmacy-status')
  async getPharmacyStatusData() {
    return this.dashboardService.getPharmacyStatusData();
  }

  /**
   * GET /admin/dashboard/user-status
   * Get user status distribution
   */
  @Get('user-status')
  async getUserStatusData() {
    return this.dashboardService.getUserStatusData();
  }

  /**
   * GET /admin/dashboard/top-pharmacies
   * Get most active pharmacies
   */
  @Get('top-pharmacies')
  async getTopPharmacies() {
    return this.dashboardService.getTopPharmacies();
  }

  /**
   * GET /admin/dashboard/monthly-comparison
   * Get monthly comparison data
   */
  @Get('monthly-comparison')
  async getMonthlyComparison() {
    return this.dashboardService.getMonthlyComparison();
  }
}

