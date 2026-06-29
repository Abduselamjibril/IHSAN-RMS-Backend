import { DataSource, EntitySubscriberInterface, EventSubscriber, InsertEvent, UpdateEvent, RemoveEvent } from 'typeorm';
import { Injectable } from '@nestjs/common';
import { SalesContract } from '../../sales/entities/sales-contract.entity';
import { Payment } from '../../finance/entities/payment.entity';
import { Lead } from '../../crm/entities/lead.entity';
import { SalesReservation } from '../../sales/entities/sales-reservation.entity';
import { DashboardService } from '../services/dashboard.service';

@Injectable()
@EventSubscriber()
export class ReportsSubscriber implements EntitySubscriberInterface {
  constructor(
    private readonly dataSource: DataSource,
    private readonly dashboardService: DashboardService,
  ) {
    this.dataSource.subscribers.push(this);
  }

  afterInsert(event: InsertEvent<any>) {
    const name = event.metadata.targetName;
    if (['SalesContract', 'Payment', 'Lead', 'SalesReservation'].includes(name)) {
      this.dashboardService.invalidateCacheAndBroadcast().catch(() => {});
    }
  }

  afterUpdate(event: UpdateEvent<any>) {
    const name = event.metadata.targetName;
    if (['SalesContract', 'Payment', 'Lead', 'SalesReservation'].includes(name)) {
      this.dashboardService.invalidateCacheAndBroadcast().catch(() => {});
    }
  }

  afterRemove(event: RemoveEvent<any>) {
    const name = event.metadata.targetName;
    if (['SalesContract', 'Payment', 'Lead', 'SalesReservation'].includes(name)) {
      this.dashboardService.invalidateCacheAndBroadcast().catch(() => {});
    }
  }
}
