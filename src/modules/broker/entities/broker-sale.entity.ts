import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, ManyToOne, JoinColumn, Index } from 'typeorm';
import { Broker } from './broker.entity';
import { Customer } from '../../crm/entities/customer.entity';
import { Property } from '../../properties/entities/property.entity';
import { SalesReservation } from '../../sales/entities/sales-reservation.entity';
import { SalesContract } from '../../sales/entities/sales-contract.entity';

@Entity('rems_broker_sale')
@Index('IX_BrokerSale_BrokerId', ['broker', 'saleDate'])
@Index('IX_BrokerSale_ProjectId', ['property'])
export class BrokerSale {
  @PrimaryGeneratedColumn({ type: 'bigint', name: 'broker_sale_id' })
  id: number;

  @ManyToOne(() => Broker, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'broker_id' })
  broker: Broker;

  @ManyToOne(() => Customer, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'customer_id' })
  customer: Customer;

  @ManyToOne(() => Property, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'property_id' })
  property: Property;

  @ManyToOne(() => SalesReservation, { nullable: true, onDelete: 'SET NULL' })
  @JoinColumn({ name: 'reservation_id' })
  reservation: SalesReservation | null;

  @ManyToOne(() => SalesContract, { nullable: true, onDelete: 'SET NULL' })
  @JoinColumn({ name: 'sales_contract_id' })
  salesContract: SalesContract | null;

  @Column({ name: 'sale_amount', type: 'numeric', precision: 18, scale: 2 })
  saleAmount: number;

  @Column({ name: 'sale_date', type: 'timestamptz' })
  saleDate: Date;

  @Column({ name: 'sale_status_id', type: 'varchar', length: 50, default: 'ACTIVE' })
  saleStatusId: string; // ACTIVE, CANCELLED

  @CreateDateColumn({ name: 'created_date', type: 'timestamptz' })
  createdAt: Date;
}
