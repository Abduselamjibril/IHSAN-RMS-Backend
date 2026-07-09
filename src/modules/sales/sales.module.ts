import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

// CRM entities needed
import { Customer } from '../crm/entities/customer.entity';
import { Lead } from '../crm/entities/lead.entity';
import { SalesAgent } from '../crm/entities/sales-agent.entity';

// Property entities needed
import { Property } from '../properties/entities/property.entity';
import { Unit } from '../properties/entities/unit.entity';
import { UnitStatus } from '../properties/entities/unit-status.entity';
import { UnitStatusHistory } from '../properties/entities/unit-status-history.entity';
import { UnitPrice } from '../properties/entities/unit-price.entity';
import { PricePromotion } from '../properties/entities/price-promotion.entity';

// Sales entities
import { SalesReservation } from './entities/sales-reservation.entity';
import { SalesReservationExtension } from './entities/sales-reservation-extension.entity';
import { SalesQuotation } from './entities/sales-quotation.entity';
import { SalesQuotationItem } from './entities/sales-quotation-item.entity';
import { SalesBooking } from './entities/sales-booking.entity';
import { SalesAgreement } from './entities/sales-agreement.entity';
import { SalesContract } from './entities/sales-contract.entity';
import { SalesContractDocument } from './entities/sales-contract-document.entity';
import { InstallmentSchedule } from './entities/installment-schedule.entity';
import { DiscountRequest } from './entities/discount-request.entity';
import { DiscountApprovalHistory } from './entities/discount-approval-history.entity';
import { SalesCommissionRule } from './entities/sales-commission-rule.entity';
import { SalesCommission } from './entities/sales-commission.entity';
import { SalesAuditLog } from './entities/sales-audit-log.entity';

import { FinanceModule } from '../finance/finance.module';
import { BrokerModule } from '../broker/broker.module';
import { SalesService } from './services/sales.service';
import { SalesController } from './controllers/sales.controller';
import { forwardRef } from '@nestjs/common';

@Module({
  imports: [
    forwardRef(() => FinanceModule),
    BrokerModule,
    TypeOrmModule.forFeature([
      Customer,
      Lead,
      SalesAgent,
      Property,
      Unit,
      UnitStatus,
      UnitStatusHistory,
      UnitPrice,
      PricePromotion,

      SalesReservation,
      SalesReservationExtension,
      SalesQuotation,
      SalesQuotationItem,
      SalesBooking,
      SalesAgreement,
      SalesContract,
      SalesContractDocument,
      InstallmentSchedule,
      DiscountRequest,
      DiscountApprovalHistory,
      SalesCommissionRule,
      SalesCommission,
      SalesAuditLog,
    ]),
  ],
  controllers: [SalesController],
  providers: [SalesService],
  exports: [SalesService],
})
export class SalesModule {}
