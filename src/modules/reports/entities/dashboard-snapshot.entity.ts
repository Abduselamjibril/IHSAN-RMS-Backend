import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, Index } from 'typeorm';

@Entity('rems_dashboard_snapshot')
@Index('idx_rems_dashboard_snapshot_date', ['snapshotDate'], { unique: true })
export class DashboardSnapshot {
  @PrimaryGeneratedColumn({ type: 'bigint' })
  id: number;

  @Column({ name: 'snapshot_date', type: 'date', unique: true })
  snapshotDate: Date;

  @Column({ name: 'total_sites', type: 'integer', default: 0 })
  totalSites: number;

  @Column({ name: 'total_properties', type: 'integer', default: 0 })
  totalProperties: number;

  @Column({ name: 'available_inventory', type: 'integer', default: 0 })
  availableInventory: number;

  @Column({ name: 'units_sold', type: 'integer', default: 0 })
  unitsSold: number;

  @Column({ name: 'total_revenue', type: 'numeric', precision: 18, scale: 2, default: 0 })
  totalRevenue: number;

  @Column({ name: 'total_collections', type: 'numeric', precision: 18, scale: 2, default: 0 })
  totalCollections: number;

  @Column({ name: 'outstanding_balances', type: 'numeric', precision: 18, scale: 2, default: 0 })
  outstandingBalances: number;

  @Column({ name: 'active_leads', type: 'integer', default: 0 })
  activeLeads: number;

  @Column({ name: 'lead_conversion_rate', type: 'numeric', precision: 5, scale: 2, default: 0 })
  leadConversionRate: number;

  @Column({ name: 'broker_sales', type: 'numeric', precision: 18, scale: 2, default: 0 })
  brokerSales: number;

  @CreateDateColumn({ name: 'created_at', type: 'timestamp', default: () => 'CURRENT_TIMESTAMP' })
  createdAt: Date;
}
