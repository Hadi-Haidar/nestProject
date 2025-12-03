import { Controller, Get, Param } from '@nestjs/common';
import { NotificationService } from './notification.service';

@Controller('notifications')
export class NotificationController {
  constructor(private readonly notificationService: NotificationService) {}

  /**
   * Get pending notifications for a pharmacy
   */
  @Get('pharmacy/:pharmacyId')
  async getPendingNotifications(@Param('pharmacyId') pharmacyId: string) {
    return this.notificationService.getPendingNotifications(pharmacyId);
  }
}
