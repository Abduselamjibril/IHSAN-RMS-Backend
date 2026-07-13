import { Controller, Get, Post, Put, Body, Param, Query, Patch, Delete } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { NotificationsService } from '../services/notifications.service';
import { NotificationsSchedulerService } from '../services/notifications-scheduler.service';
import { SendNotificationDto, CreateTemplateDto, UpdateTemplateDto } from '../dto/notification.dto';

@ApiTags('Notifications')
@Controller('api/notifications')
export class NotificationsController {
  constructor(
    private readonly service: NotificationsService,
    private readonly scheduler: NotificationsSchedulerService,
  ) {}

  @Post('send')
  sendNotification(@Body() dto: SendNotificationDto) {
    return this.service.sendNotification(dto);
  }

  @Post('payment-reminders/run')
  async runPaymentReminders() {
    await this.scheduler.runAllSweeps();
    return { success: true, message: 'All notification sweep jobs executed successfully.' };
  }

  @Get('history')
  getHistoryLogs() {
    return this.service.getHistoryLogs();
  }

  @Get('stats')
  getDeliveryStats() {
    return this.service.getDeliveryStats();
  }

  // --- Templates ---
  @Get('templates')
  getTemplates() {
    return this.service.getTemplates();
  }

  @Post('templates')
  createTemplate(@Body() dto: CreateTemplateDto) {
    return this.service.createTemplate(dto);
  }

  @Put('templates/:id')
  updateTemplate(@Param('id') id: string, @Body() dto: UpdateTemplateDto) {
    return this.service.updateTemplate(+id, dto);
  }

  // --- In-App Inbox ---
  @Get('inbox')
  getUserInbox(@Query('userId') userId: string) {
    // Default to User ID 1 if not specified
    const targetUserId = userId ? +userId : 1;
    return this.service.getUserInbox(targetUserId);
  }

  @Get('unread-count')
  getUnreadCount(@Query('userId') userId: string) {
    const targetUserId = userId ? +userId : 1;
    return this.service.getUnreadCount(targetUserId);
  }

  @Post('read')
  markAsRead(@Query('userId') userId: string, @Body('recipientId') recipientId?: number) {
    const targetUserId = userId ? +userId : 1;
    return this.service.markAsRead(targetUserId, recipientId);
  }

  // --- Preferences ---
  @Get('preferences')
  getUserPreferences(@Query('userId') userId: string) {
    const targetUserId = userId ? +userId : 1;
    return this.service.getUserPreferences(targetUserId);
  }

  @Post('preferences')
  updateUserPreferences(@Query('userId') userId: string, @Body('preferences') preferences: any[]) {
    const targetUserId = userId ? +userId : 1;
    return this.service.updateUserPreferences(targetUserId, preferences);
  }

  // --- Telegram Configurations & Actions ---
  @Get('telegram/status')
  getTelegramStatus() {
    return this.service.getTelegramStatus();
  }

  @Get('telegram/config')
  getTelegramConfig() {
    return this.service.getTelegramConfig();
  }

  @Post('telegram/config')
  updateTelegramConfig(
    @Body() dto: { telegramApiId: number; telegramApiHash: string; telegramSessionString: string }
  ) {
    return this.service.updateTelegramConfig(dto);
  }
}
