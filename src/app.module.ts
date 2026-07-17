import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { APP_INTERCEPTOR, APP_GUARD } from '@nestjs/core';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { CrmModule } from './modules/crm/crm.module';
import { PropertiesModule } from './modules/properties/properties.module';
import { SalesModule } from './modules/sales/sales.module';
import { FinanceModule } from './modules/finance/finance.module';
import { MarketingModule } from './modules/marketing/marketing.module';
import { BrokerModule } from './modules/broker/broker.module';
import { ReportsModule } from './modules/reports/reports.module';
import { SecurityModule } from './modules/security/security.module';
import { WorkflowModule } from './modules/workflow/workflow.module';
import { NotificationsModule } from './modules/notifications/notifications.module';
import { AuditLogInterceptor } from './modules/security/interceptors/audit-log.interceptor';
import { PermissionGuard } from './modules/security/guards/permission.guard';
import { MulterModule } from '@nestjs/platform-express';

const allowedUploadMimeTypes = new Set([
  'application/pdf', 'text/plain', 'text/csv',
  'image/jpeg', 'image/png', 'image/webp',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
]);

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    MulterModule.register({
      limits: { fileSize: 10 * 1024 * 1024, files: 1 },
      fileFilter: (_req, file, callback) => callback(null, allowedUploadMimeTypes.has(file.mimetype)),
    }),
    CrmModule,
    PropertiesModule,
    SalesModule,
    FinanceModule,
    MarketingModule,
    BrokerModule,
    ReportsModule,
    SecurityModule,
    WorkflowModule,
    NotificationsModule,
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: (configService: ConfigService) => {
        const isProduction = configService.get<string>('NODE_ENV') === 'production';
        const dbPassword = configService.get<string>('DB_PASSWORD');

        if (isProduction && (!dbPassword || dbPassword === 'password')) {
          throw new Error('CRITICAL ERROR: DB_PASSWORD environment variable must be specified and must not be "password" in production!');
        }

        return {
          type: 'postgres',
          host: configService.get<string>('DB_HOST', 'localhost'),
          port: configService.get<number>('DB_PORT', 5432),
          username: configService.get<string>('DB_USERNAME', 'postgres'),
          password: dbPassword || 'password',
          database: configService.get<string>('DB_DATABASE', 'ihsan_db'),
          autoLoadEntities: true,
          synchronize: !isProduction,
        };
      },
      inject: [ConfigService],
    }),
  ],
  controllers: [AppController],
  providers: [
    AppService,
    {
      provide: APP_INTERCEPTOR,
      useClass: AuditLogInterceptor,
    },
    {
      provide: APP_GUARD,
      useClass: PermissionGuard,
    },
  ],
})
export class AppModule {}
