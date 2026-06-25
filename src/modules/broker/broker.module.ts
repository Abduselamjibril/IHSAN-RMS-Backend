import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

// Entities
import { Broker } from './entities/broker.entity';
import { BrokerBankAccount } from './entities/broker-bank-account.entity';
import { BrokerDocument } from './entities/broker-document.entity';
import { BrokerProjectAssignment } from './entities/broker-project-assignment.entity';
import { LeadBrokerAssignment } from './entities/lead-broker-assignment.entity';
import { CommissionPlan } from './entities/commission-plan.entity';
import { CommissionPlanDetail } from './entities/commission-plan-detail.entity';
import { ProjectCommissionPlan } from './entities/project-commission-plan.entity';
import { BrokerSale } from './entities/broker-sale.entity';
import { BrokerCommission } from './entities/broker-commission.entity';
import { BrokerCommissionAdjustment } from './entities/broker-commission-adjustment.entity';
import { CommissionPayment } from './entities/commission-payment.entity';
import { CommissionPaymentDetail } from './entities/commission-payment-detail.entity';
import { BrokerPerformanceSnapshot } from './entities/broker-performance-snapshot.entity';
import { BrokerTarget } from './entities/broker-target.entity';

// Referenced Entities
import { Lead } from '../crm/entities/lead.entity';
import { Property } from '../properties/entities/property.entity';
import { Customer } from '../crm/entities/customer.entity';
import { SalesReservation } from '../sales/entities/sales-reservation.entity';
import { SalesContract } from '../sales/entities/sales-contract.entity';

// Service & Controller
import { BrokerService } from './services/broker.service';
import { BrokerController } from './controllers/broker.controller';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      Broker,
      BrokerBankAccount,
      BrokerDocument,
      BrokerProjectAssignment,
      LeadBrokerAssignment,
      CommissionPlan,
      CommissionPlanDetail,
      ProjectCommissionPlan,
      BrokerSale,
      BrokerCommission,
      BrokerCommissionAdjustment,
      CommissionPayment,
      CommissionPaymentDetail,
      BrokerPerformanceSnapshot,
      BrokerTarget,

      // Referenced entities
      Lead,
      Property,
      Customer,
      SalesReservation,
      SalesContract,
    ]),
  ],
  controllers: [BrokerController],
  providers: [BrokerService],
  exports: [TypeOrmModule, BrokerService],
})
export class BrokerModule {}
