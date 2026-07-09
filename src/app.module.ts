import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { APP_INTERCEPTOR } from '@nestjs/core';
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
import { AuditLogInterceptor } from './modules/security/interceptors/audit-log.interceptor';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
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
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: (configService: ConfigService) => ({
        type: 'postgres',
        host: configService.get<string>('DB_HOST', 'localhost'),
        port: configService.get<number>('DB_PORT', 5432),
        username: configService.get<string>('DB_USERNAME', 'postgres'),
        password: configService.get<string>('DB_PASSWORD', 'password'),
        database: configService.get<string>('DB_DATABASE', 'ihsan_db'),
        autoLoadEntities: true,
        synchronize: true, // Warning: true is excellent for local dev but not recommended for production
      }),
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
  ],
})
export class AppModule {}
