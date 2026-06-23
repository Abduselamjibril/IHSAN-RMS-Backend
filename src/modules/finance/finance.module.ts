import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

// Entities
import { PaymentMethod } from './entities/payment-method.entity';
import { Payment } from './entities/payment.entity';
import { PaymentApproval } from './entities/payment-approval.entity';
import { PaymentAllocation } from './entities/payment-allocation.entity';
import { ReceiptTemplate } from './entities/receipt-template.entity';
import { Receipt } from './entities/receipt.entity';
import { PenaltyConfiguration } from './entities/penalty-configuration.entity';
import { PenaltyTransaction } from './entities/penalty-transaction.entity';
import { CustomerBalance } from './entities/customer-balance.entity';
import { RevenueSummary } from './entities/revenue-summary.entity';
import { NotificationTemplate } from './entities/notification-template.entity';
import { ReminderConfiguration } from './entities/reminder-configuration.entity';
import { PaymentReminder } from './entities/payment-reminder.entity';
import { OrganizationSettings } from './entities/organization-settings.entity';
import { UserSignature } from './entities/user-signature.entity';

// CRM & Sales Entities needed
import { Customer } from '../crm/entities/customer.entity';
import { SalesContract } from '../sales/entities/sales-contract.entity';
import { InstallmentSchedule } from '../sales/entities/installment-schedule.entity';

// Controller & Service
import { FinanceService } from './services/finance.service';
import { FinanceController } from './controllers/finance.controller';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      PaymentMethod,
      Payment,
      PaymentApproval,
      PaymentAllocation,
      ReceiptTemplate,
      Receipt,
      PenaltyConfiguration,
      PenaltyTransaction,
      CustomerBalance,
      RevenueSummary,
      NotificationTemplate,
      ReminderConfiguration,
      PaymentReminder,
      OrganizationSettings,
      UserSignature,
      Customer,
      SalesContract,
      InstallmentSchedule,
    ]),
  ],
  controllers: [FinanceController],
  providers: [FinanceService],
  exports: [FinanceService],
})
export class FinanceModule {}
