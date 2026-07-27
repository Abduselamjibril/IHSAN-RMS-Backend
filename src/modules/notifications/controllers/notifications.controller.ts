import { Controller, Get, Post, Put, Body, Param, Query, Patch, Delete, Req } from '@nestjs/common';
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

  @Get('categories')
  getCategories() {
    return this.service.getCategories();
  }

  @Get('channels')
  getChannels() {
    return this.service.getChannels();
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
  getUserInbox(@Req() req: any) {
    return this.service.getUserInbox(Number(req.user.userId));
  }

  @Get('unread-count')
  getUnreadCount(@Req() req: any) {
    return this.service.getUnreadCount(Number(req.user.userId));
  }

  @Post('read')
  markAsRead(@Req() req: any, @Body('recipientId') recipientId?: number) {
    return this.service.markAsRead(Number(req.user.userId), recipientId);
  }

  // --- Preferences ---
  @Get('preferences')
  getUserPreferences(@Req() req: any) {
    return this.service.getUserPreferences(Number(req.user.userId));
  }

  @Post('preferences')
  updateUserPreferences(@Req() req: any, @Body('preferences') preferences: any[]) {
    return this.service.updateUserPreferences(Number(req.user.userId), preferences);
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

  @Post('telegram/request-code')
  requestTelegramCode(
    @Body() dto: { apiId: number; apiHash: string; phoneNumber: string }
  ) {
    return this.service.requestTelegramCode(dto.apiId, dto.apiHash, dto.phoneNumber);
  }

  @Post('telegram/verify-code')
  verifyTelegramCode(
    @Body() dto: { phoneNumber: string; code: string; password?: string }
  ) {
    return this.service.verifyTelegramCode(dto.phoneNumber, dto.code, dto.password);
  }
}
