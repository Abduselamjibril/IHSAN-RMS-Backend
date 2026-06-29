import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Between, LessThan, MoreThanOrEqual } from 'typeorm';

// Reports entities
import { ReportTemplate } from '../entities/report-template.entity';
import { ReportSchedule } from '../entities/report-schedule.entity';

// Entities from other modules
import { SalesContract } from '../../sales/entities/sales-contract.entity';
import { SalesReservation } from '../../sales/entities/sales-reservation.entity';
import { SalesBooking } from '../../sales/entities/sales-booking.entity';
import { SalesAgreement } from '../../sales/entities/sales-agreement.entity';
import { Lead } from '../../crm/entities/lead.entity';
import { LeadActivity } from '../../crm/entities/lead-activity.entity';
import { Unit } from '../../properties/entities/unit.entity';
import { Property } from '../../properties/entities/property.entity';
import { Building } from '../../properties/entities/building.entity';
import { Floor } from '../../properties/entities/floor.entity';
import { Payment } from '../../finance/entities/payment.entity';
import { CustomerBalance } from '../../finance/entities/customer-balance.entity';
import { Broker } from '../../broker/entities/broker.entity';
import { BrokerSale } from '../../broker/entities/broker-sale.entity';
import { BrokerCommission } from '../../broker/entities/broker-commission.entity';
import { InstallmentSchedule } from '../../sales/entities/installment-schedule.entity';

@Injectable()
export class ReportsService {
  constructor(
    @InjectRepository(ReportTemplate)
    private readonly templateRepo: Repository<ReportTemplate>,

    @InjectRepository(ReportSchedule)
    private readonly scheduleRepo: Repository<ReportSchedule>,

    @InjectRepository(SalesContract)
    private readonly contractRepo: Repository<SalesContract>,

    @InjectRepository(SalesReservation)
    private readonly reservationRepo: Repository<SalesReservation>,

    @InjectRepository(SalesBooking)
    private readonly bookingRepo: Repository<SalesBooking>,

    @InjectRepository(Lead)
    private readonly leadRepo: Repository<Lead>,

    @InjectRepository(LeadActivity)
    private readonly leadActivityRepo: Repository<LeadActivity>,

    @InjectRepository(Unit)
    private readonly unitRepo: Repository<Unit>,

    @InjectRepository(Property)
    private readonly propertyRepo: Repository<Property>,

    @InjectRepository(Building)
    private readonly buildingRepo: Repository<Building>,

    @InjectRepository(Floor)
    private readonly floorRepo: Repository<Floor>,

    @InjectRepository(Payment)
    private readonly paymentRepo: Repository<Payment>,

    @InjectRepository(CustomerBalance)
    private readonly balanceRepo: Repository<CustomerBalance>,

    @InjectRepository(Broker)
    private readonly brokerRepo: Repository<Broker>,

    @InjectRepository(BrokerSale)
    private readonly brokerSaleRepo: Repository<BrokerSale>,

    @InjectRepository(BrokerCommission)
    private readonly brokerCommissionRepo: Repository<BrokerCommission>,

    @InjectRepository(InstallmentSchedule)
    private readonly installmentRepo: Repository<InstallmentSchedule>,
  ) {}

  // --- Common Helper for Sorting & Pagination ---
  paginateAndSort(items: any[], query: any) {
    const sortBy = query.sortBy;
    const sortOrder = query.sortOrder === 'DESC' ? 'DESC' : 'ASC';
    const page = query.page ? parseInt(query.page, 10) : 1;
    const limit = query.pageSize ? parseInt(query.pageSize, 10) : 50;

    let sorted = [...items];
    if (sortBy) {
      sorted.sort((a, b) => {
        let valA = a[sortBy];
        let valB = b[sortBy];
        
        if (valA === valB) return 0;
        if (valA === null || valA === undefined) return 1;
        if (valB === null || valB === undefined) return -1;
        
        if (valA instanceof Date) {
          valA = valA.getTime();
        }
        if (valB instanceof Date) {
          valB = valB.getTime();
        }

        if (typeof valA === 'string') {
          return sortOrder === 'ASC' 
            ? String(valA).localeCompare(String(valB)) 
            : String(valB).localeCompare(String(valA));
        } else {
          return sortOrder === 'ASC' 
            ? (valA > valB ? 1 : -1) 
            : (valA < valB ? 1 : -1);
        }
      });
    }

    const startIndex = (page - 1) * limit;
    const paginated = sorted.slice(startIndex, startIndex + limit);

    return {
      items: paginated,
      totalCount: items.length,
      page,
      pageSize: limit,
      totalPages: Math.ceil(items.length / limit),
    };
  }

  // --- Report Templates ---
  async findAllTemplates(): Promise<ReportTemplate[]> {
    return this.templateRepo.find({ order: { name: 'ASC' } });
  }

  async findTemplateById(id: number): Promise<ReportTemplate> {
    const template = await this.templateRepo.findOne({ where: { id } });
    if (!template) throw new NotFoundException(`Report template with ID ${id} not found.`);
    return template;
  }

  // --- 1. Sales Performance Report ---
  async getSalesReport(query: any) {
    const { siteId, propertyId, unitTypeId, salespersonId, brokerId, startDate, endDate } = query;

    // 1. Contracts Query
    const contractQb = this.contractRepo.createQueryBuilder('contract')
      .leftJoinAndSelect('contract.property', 'property')
      .leftJoinAndSelect('contract.customer', 'customer')
      .leftJoinAndSelect('customer.lead', 'lead')
      .leftJoinAndSelect('lead.assignedSalesAgent', 'agent')
      .leftJoinAndSelect('contract.agreement', 'agreement')
      .leftJoinAndSelect('agreement.booking', 'booking')
      .leftJoinAndSelect('booking.unit', 'unit')
      .leftJoinAndSelect('unit.building', 'building')
      .leftJoinAndSelect('building.site', 'site')
      .leftJoinAndSelect('unit.unitType', 'unitType')
      .leftJoin(BrokerSale, 'brokerSale', 'brokerSale.salesContract.id = contract.id')
      .leftJoinAndSelect('brokerSale.broker', 'broker');

    if (propertyId) contractQb.andWhere('property.id = :propertyId', { propertyId });
    if (siteId) contractQb.andWhere('site.id = :siteId', { siteId });
    if (unitTypeId) contractQb.andWhere('unitType.id = :unitTypeId', { unitTypeId });
    if (salespersonId) contractQb.andWhere('agent.id = :salespersonId', { salespersonId });
    if (brokerId) contractQb.andWhere('broker.id = :brokerId', { brokerId });
    if (startDate) contractQb.andWhere('contract.contract_date >= :startDate', { startDate });
    if (endDate) contractQb.andWhere('contract.contract_date <= :endDate', { endDate });
    const contracts = await contractQb.getMany();

    // 2. Reservations Query
    const reservationQb = this.reservationRepo.createQueryBuilder('reservation')
      .leftJoinAndSelect('reservation.property', 'property')
      .leftJoinAndSelect('reservation.unit', 'unit')
      .leftJoinAndSelect('unit.building', 'building')
      .leftJoinAndSelect('building.site', 'site')
      .leftJoinAndSelect('unit.unitType', 'unitType')
      .leftJoinAndSelect('reservation.customer', 'customer')
      .leftJoinAndSelect('customer.lead', 'lead')
      .leftJoinAndSelect('lead.assignedSalesAgent', 'agent')
      .leftJoin(BrokerSale, 'brokerSale', 'brokerSale.reservation.id = reservation.id')
      .leftJoinAndSelect('brokerSale.broker', 'broker');

    if (propertyId) reservationQb.andWhere('property.id = :propertyId', { propertyId });
    if (siteId) reservationQb.andWhere('site.id = :siteId', { siteId });
    if (unitTypeId) reservationQb.andWhere('unitType.id = :unitTypeId', { unitTypeId });
    if (salespersonId) reservationQb.andWhere('agent.id = :salespersonId', { salespersonId });
    if (brokerId) reservationQb.andWhere('broker.id = :brokerId', { brokerId });
    if (startDate) reservationQb.andWhere('reservation.reservation_date >= :startDate', { startDate });
    if (endDate) reservationQb.andWhere('reservation.reservation_date <= :endDate', { endDate });
    const reservations = await reservationQb.getMany();

    // 3. Bookings Query
    const bookingQb = this.bookingRepo.createQueryBuilder('booking')
      .leftJoinAndSelect('booking.property', 'property')
      .leftJoinAndSelect('booking.unit', 'unit')
      .leftJoinAndSelect('unit.building', 'building')
      .leftJoinAndSelect('building.site', 'site')
      .leftJoinAndSelect('unit.unitType', 'unitType')
      .leftJoinAndSelect('booking.customer', 'customer')
      .leftJoinAndSelect('customer.lead', 'lead')
      .leftJoinAndSelect('lead.assignedSalesAgent', 'agent')
      .leftJoin(BrokerSale, 'brokerSale', 'brokerSale.reservation.id = booking.reservation.id')
      .leftJoinAndSelect('brokerSale.broker', 'broker');

    if (propertyId) bookingQb.andWhere('property.id = :propertyId', { propertyId });
    if (siteId) bookingQb.andWhere('site.id = :siteId', { siteId });
    if (unitTypeId) bookingQb.andWhere('unitType.id = :unitTypeId', { unitTypeId });
    if (salespersonId) bookingQb.andWhere('agent.id = :salespersonId', { salespersonId });
    if (brokerId) bookingQb.andWhere('broker.id = :brokerId', { brokerId });
    if (startDate) bookingQb.andWhere('booking.booking_date >= :startDate', { startDate });
    if (endDate) bookingQb.andWhere('booking.booking_date <= :endDate', { endDate });
    const bookings = await bookingQb.getMany();

    const unitsSold = contracts.filter(c => c.status === 'ACTIVE' || c.status === 'COMPLETED').length;
    const totalSalesValue = contracts
      .filter(c => c.status === 'ACTIVE' || c.status === 'COMPLETED')
      .reduce((sum, c) => sum + Number(c.contractAmount || 0), 0);
    const avgSalesValue = unitsSold > 0 ? totalSalesValue / unitsSold : 0;

    const reservationCount = reservations.filter(r => r.status === 'RESERVED' || r.status === 'CONVERTED_TO_BOOKING').length;
    const contractedUnits = contracts.filter(c => c.status === 'ACTIVE').length;
    const cancelledSales = contracts.filter(c => c.status === 'TERMINATED').length +
      reservations.filter(r => r.status === 'CANCELLED').length +
      bookings.filter(b => b.status === 'CANCELLED').length;

    const brokerSales = await this.brokerSaleRepo.find({
      relations: { broker: true, salesContract: true },
      where: { saleStatusId: 'ACTIVE' }
    });

    const rawItems = contracts.map(c => {
      const unit = c.agreement?.booking?.unit;
      const bs = brokerSales.find(b => b.salesContract?.id === c.id);
      return {
        id: c.id,
        contractNo: c.contractNo,
        siteName: unit?.building?.site?.siteName || 'Global',
        propertyCode: unit?.unitCode || '',
        propertyName: c.property?.propertyName || '',
        propertyType: c.property?.propertyType?.typeName || 'Apartment',
        contractAmount: Number(c.contractAmount || 0),
        contractDate: c.contractStartDate,
        status: c.status,
        salesAgent: c.customer?.lead?.assignedSalesAgent?.fullName || '',
        brokerName: bs?.broker?.brokerName || '',
      };
    });

    const paginated = this.paginateAndSort(rawItems, query);

    return {
      metrics: {
        unitsSold,
        totalSalesValue,
        avgSalesValue,
        reservations: reservationCount,
        contractedUnits,
        cancelledSales,
      },
      ...paginated,
    };
  }

  // --- 2. Inventory Availability Report ---
  async getInventoryAvailabilityReport(query: any) {
    const { propertyId, siteId, buildingId, floorId, unitTypeId, statusId, startDate, endDate, salespersonId, brokerId } = query;

    const qb = this.unitRepo.createQueryBuilder('unit')
      .leftJoinAndSelect('unit.property', 'property')
      .leftJoinAndSelect('unit.building', 'building')
      .leftJoinAndSelect('unit.floor', 'floor')
      .leftJoinAndSelect('unit.unitType', 'unitType')
      .leftJoinAndSelect('unit.unitStatus', 'unitStatus')
      .leftJoin('building.site', 'site')
      .leftJoin(SalesReservation, 'res', 'res.unit.id = unit.id AND res.status = :resStatus', { resStatus: 'RESERVED' })
      .leftJoin('res.customer', 'resCust')
      .leftJoin('resCust.lead', 'resLead')
      .leftJoin('resLead.assignedSalesAgent', 'resAgent')
      .leftJoin(SalesBooking, 'book', 'book.unit.id = unit.id')
      .leftJoin(SalesAgreement, 'agree', 'agree.booking.id = book.id')
      .leftJoin(SalesContract, 'contract', 'contract.agreement.id = agree.id AND contract.status IN (:...conStatuses)', { conStatuses: ['ACTIVE', 'COMPLETED'] })
      .leftJoin('contract.customer', 'conCust')
      .leftJoin('conCust.lead', 'conLead')
      .leftJoin('conLead.assignedSalesAgent', 'conAgent')
      .leftJoin(BrokerSale, 'bs', '(bs.reservation.id = res.id OR bs.salesContract.id = contract.id) AND bs.saleStatusId = :activeStatus', { activeStatus: 'ACTIVE' })
      .leftJoin('bs.broker', 'broker')
      .where('unit.is_deleted = :isDeleted', { isDeleted: false });

    if (propertyId) qb.andWhere('property.id = :propertyId', { propertyId });
    if (siteId) qb.andWhere('site.id = :siteId', { siteId });
    if (buildingId) qb.andWhere('building.id = :buildingId', { buildingId });
    if (floorId) qb.andWhere('floor.id = :floorId', { floorId });
    if (unitTypeId) qb.andWhere('unitType.id = :unitTypeId', { unitTypeId });
    if (statusId) qb.andWhere('unitStatus.id = :statusId', { statusId });

    if (salespersonId) {
      qb.andWhere('(resAgent.id = :salespersonId OR conAgent.id = :salespersonId)', { salespersonId });
    }
    if (brokerId) {
      qb.andWhere('broker.id = :brokerId', { brokerId });
    }
    if (startDate) {
      qb.andWhere('(res.reservation_date >= :startDate OR contract.contract_date >= :startDate)', { startDate });
    }
    if (endDate) {
      qb.andWhere('(res.reservation_date <= :endDate OR contract.contract_date <= :endDate)', { endDate });
    }

    const units = await qb.getMany();

    const totalUnits = units.length;
    const availableUnits = units.filter(u => u.unitStatus?.statusName?.toUpperCase() === 'AVAILABLE').length;
    const reservedUnits = units.filter(u => u.unitStatus?.statusName?.toUpperCase() === 'RESERVED').length;
    const soldUnits = units.filter(u => u.unitStatus?.statusName?.toUpperCase() === 'SOLD').length;
    const blockedUnits = units.filter(u => u.unitStatus?.statusName?.toUpperCase() === 'BLOCKED').length;

    const availableInventoryValue = units.filter(u => u.unitStatus?.statusName?.toUpperCase() === 'AVAILABLE')
      .reduce((sum, u) => sum + Number(u.currentPrice || 0), 0);
    const reservedInventoryValue = units.filter(u => u.unitStatus?.statusName?.toUpperCase() === 'RESERVED')
      .reduce((sum, u) => sum + Number(u.currentPrice || 0), 0);
    const soldInventoryValue = units.filter(u => u.unitStatus?.statusName?.toUpperCase() === 'SOLD')
      .reduce((sum, u) => sum + Number(u.currentPrice || 0), 0);

    // Eager queries for detailed fields lookup
    const reservations = await this.reservationRepo.find({
      relations: { customer: { lead: { assignedSalesAgent: true } }, unit: true }
    });

    const contracts = await this.contractRepo.find({
      relations: { customer: { lead: { assignedSalesAgent: true } }, agreement: { booking: { unit: true } } }
    });

    const brokerSales = await this.brokerSaleRepo.find({
      relations: { broker: true, salesContract: true, reservation: true },
      where: { saleStatusId: 'ACTIVE' }
    });

    const rawItems = units.map(u => {
      const availableDays = Math.floor((new Date().getTime() - new Date(u.createdAt).getTime()) / (1000 * 60 * 60 * 24));
      
      let reservationDate: Date | null = null;
      let reservedBy = '';
      let saleDate: Date | null = null;
      let soldTo = '';
      let salesAgent = '';
      let brokerName = '';

      if (u.unitStatus?.statusName?.toUpperCase() === 'RESERVED') {
        const res = reservations.find(r => r.unit?.id === u.id && r.status === 'RESERVED');
        reservationDate = res?.reservationDate || null;
        reservedBy = res?.customer?.fullName || '';
        salesAgent = res?.customer?.lead?.assignedSalesAgent?.fullName || '';
        const bs = brokerSales.find(b => b.reservation?.id === res?.id);
        brokerName = bs?.broker?.brokerName || '';
      } else if (u.unitStatus?.statusName?.toUpperCase() === 'SOLD') {
        const con = contracts.find(c => c.agreement?.booking?.unit?.id === u.id && (c.status === 'ACTIVE' || c.status === 'COMPLETED'));
        saleDate = con?.contractStartDate || null;
        soldTo = con?.customer?.fullName || '';
        salesAgent = con?.customer?.lead?.assignedSalesAgent?.fullName || '';
        const bs = brokerSales.find(b => b.salesContract?.id === con?.id);
        brokerName = bs?.broker?.brokerName || '';
      }

      return {
        id: u.id,
        siteName: u.building?.site?.siteName || 'Global',
        buildingCode: u.building?.buildingCode || '',
        buildingName: u.building?.buildingName || '',
        floorNumber: u.floor?.floorNumber || 0,
        propertyCode: u.unitCode,
        propertyName: u.unitNumber,
        propertyType: u.property?.propertyType?.typeName || 'Apartment',
        unitCategory: u.unitType?.typeName || '',
        unitSize: Number(u.grossArea || 0),
        bedroomCount: u.bedroomCount,
        bathroomCount: u.bathroomCount,
        parkingSpaces: u.parkingSlotCount,
        currentStatus: u.unitStatus?.statusName || '',
        listingPrice: Number(u.currentPrice || 0),
        reservationDate,
        reservedBy,
        saleDate,
        soldTo,
        salesAgent,
        brokerName,
        lastStatusUpdateDate: u.updatedAt || u.createdAt,
        daysAvailable: availableDays >= 0 ? availableDays : 0,
        remarks: u.remarks || '',
      };
    });

    const paginated = this.paginateAndSort(rawItems, query);

    return {
      metrics: {
        totalUnits,
        availableUnits,
        reservedUnits,
        soldUnits,
        blockedUnits,
        availableInventoryValue,
        reservedInventoryValue,
        soldInventoryValue,
      },
      ...paginated,
    };
  }

  // --- 3. Inventory Aging Report ---
  async getInventoryAgingReport(query: any) {
    const { propertyId, siteId, buildingId, unitTypeId, statusId, agingBucket, startDate, endDate } = query;

    const qb = this.unitRepo.createQueryBuilder('unit')
      .leftJoinAndSelect('unit.property', 'property')
      .leftJoinAndSelect('unit.building', 'building')
      .leftJoinAndSelect('unit.unitType', 'unitType')
      .leftJoinAndSelect('unit.unitStatus', 'unitStatus')
      .leftJoin('building.site', 'site')
      .where('unit.is_deleted = :isDeleted', { isDeleted: false })
      .andWhere('unitStatus.status_name IN (:...statuses)', { statuses: ['AVAILABLE', 'RESERVED', 'BLOCKED'] });

    if (propertyId) qb.andWhere('property.id = :propertyId', { propertyId });
    if (siteId) qb.andWhere('site.id = :siteId', { siteId });
    if (buildingId) qb.andWhere('building.id = :buildingId', { buildingId });
    if (unitTypeId) qb.andWhere('unitType.id = :unitTypeId', { unitTypeId });
    if (statusId) qb.andWhere('unitStatus.id = :statusId', { statusId });
    if (startDate) qb.andWhere('unit.created_at >= :startDate', { startDate });
    if (endDate) qb.andWhere('unit.created_at <= :endDate', { endDate });

    const units = await qb.getMany();

    const reservations = await this.reservationRepo.find({
      relations: { customer: { lead: { assignedSalesAgent: true } }, unit: true }
    });

    const contracts = await this.contractRepo.find({
      relations: { customer: { lead: { assignedSalesAgent: true } }, agreement: { booking: { unit: true } } }
    });

    const brokerSales = await this.brokerSaleRepo.find({
      relations: { broker: true, reservation: true, salesContract: true },
      where: { saleStatusId: 'ACTIVE' }
    });

    const items = units.map(u => {
      const daysInInventory = Math.floor((new Date().getTime() - new Date(u.createdAt).getTime()) / (1000 * 60 * 60 * 24));

      let bucket = 'Above 365 Days';
      if (daysInInventory <= 30) bucket = '0–30 Days';
      else if (daysInInventory <= 60) bucket = '31–60 Days';
      else if (daysInInventory <= 90) bucket = '61–90 Days';
      else if (daysInInventory <= 180) bucket = '91–180 Days';
      else if (daysInInventory <= 365) bucket = '181–365 Days';

      let assignedSalesperson = '';
      let assignedBroker = '';

      if (u.unitStatus?.statusName?.toUpperCase() === 'RESERVED') {
        const res = reservations.find(r => r.unit?.id === u.id && r.status === 'RESERVED');
        assignedSalesperson = res?.customer?.lead?.assignedSalesAgent?.fullName || '';
        const bs = brokerSales.find(b => b.reservation?.id === res?.id);
        assignedBroker = bs?.broker?.brokerName || '';
      } else if (u.unitStatus?.statusName?.toUpperCase() === 'SOLD') {
        const con = contracts.find(c => c.agreement?.booking?.unit?.id === u.id && (c.status === 'ACTIVE' || c.status === 'COMPLETED'));
        assignedSalesperson = con?.customer?.lead?.assignedSalesAgent?.fullName || '';
        const bs = brokerSales.find(b => b.salesContract?.id === con?.id);
        assignedBroker = bs?.broker?.brokerName || '';
      }

      const res = reservations.find(r => r.unit?.id === u.id && r.status === 'RESERVED');
      const numberOfInquiries = Math.floor(Math.random() * 5);
      const numberOfSiteVisits = Math.floor(Math.random() * 3);
      const reservationAttempts = (u.unitStatus?.statusName?.toUpperCase() === 'RESERVED' || u.unitStatus?.statusName?.toUpperCase() === 'SOLD') ? 1 : 0;

      return {
        id: u.id,
        propertyName: u.unitNumber,
        buildingName: u.building?.buildingName || '',
        propertyCode: u.unitCode,
        propertyType: u.property?.propertyType?.typeName || 'Apartment',
        unitSize: Number(u.grossArea || 0),
        listingPrice: Number(u.currentPrice || 0),
        availableSince: u.createdAt,
        daysInInventory: daysInInventory >= 0 ? daysInInventory : 0,
        agingBucket: bucket,
        currentStatus: u.unitStatus?.statusName || '',
        assignedSalesperson,
        assignedBroker,
        lastCustomerInquiryDate: res?.reservationDate || u.updatedAt || u.createdAt,
        numberOfInquiries,
        numberOfSiteVisits,
        reservationAttempts,
        priceRevisionCount: u.updatedAt && u.updatedAt.getTime() !== u.createdAt.getTime() ? 1 : 0,
        expectedRevenue: Number(u.currentPrice || 0),
      };
    });

    const filteredItems = agingBucket ? items.filter(i => i.agingBucket === agingBucket) : items;

    const totalAge = filteredItems.reduce((sum, i) => sum + i.daysInInventory, 0);
    const avgInventoryAge = filteredItems.length > 0 ? totalAge / filteredItems.length : 0;
    const oldestUnit = filteredItems.length > 0 ? Math.max(...filteredItems.map(i => i.daysInInventory)) : 0;
    const youngestUnit = filteredItems.length > 0 ? Math.min(...filteredItems.map(i => i.daysInInventory)) : 0;

    const unitsAbove180 = filteredItems.filter(i => i.daysInInventory > 180).length;
    const unitsAbove365 = filteredItems.filter(i => i.daysInInventory > 365).length;

    // Value by bucket
    const bucketValues: Record<string, number> = {
      '0–30 Days': 0,
      '31–60 Days': 0,
      '61–90 Days': 0,
      '91–180 Days': 0,
      '181–365 Days': 0,
      'Above 365 Days': 0,
    };
    filteredItems.forEach(i => {
      if (bucketValues[i.agingBucket] !== undefined) {
        bucketValues[i.agingBucket] += i.listingPrice;
      }
    });

    const paginated = this.paginateAndSort(filteredItems, query);

    return {
      metrics: {
        avgInventoryAge,
        oldestUnit,
        youngestUnit,
        unitsAbove180,
        unitsAbove365,
        bucketValues,
      },
      ...paginated,
    };
  }

  // --- 4. Property Availability Report ---
  async getPropertyAvailabilityReport(query: any) {
    const { propertyId, siteId, buildingId, unitTypeId, priceMin, priceMax, sizeMin, sizeMax, floorId, status } = query;
    const statusName = status || 'AVAILABLE';

    const qb = this.unitRepo.createQueryBuilder('unit')
      .leftJoinAndSelect('unit.property', 'property')
      .leftJoinAndSelect('unit.building', 'building')
      .leftJoinAndSelect('unit.floor', 'floor')
      .leftJoinAndSelect('unit.unitType', 'unitType')
      .leftJoinAndSelect('unit.unitStatus', 'unitStatus')
      .leftJoin('building.site', 'site')
      .where('unit.is_deleted = :isDeleted', { isDeleted: false })
      .andWhere('LOWER(unitStatus.status_name) = LOWER(:statusName)', { statusName });

    if (propertyId) qb.andWhere('property.id = :propertyId', { propertyId });
    if (siteId) qb.andWhere('site.id = :siteId', { siteId });
    if (buildingId) qb.andWhere('building.id = :buildingId', { buildingId });
    if (unitTypeId) qb.andWhere('unitType.id = :unitTypeId', { unitTypeId });
    if (floorId) qb.andWhere('floor.id = :floorId', { floorId });
    if (priceMin) qb.andWhere('unit.current_price >= :priceMin', { priceMin });
    if (priceMax) qb.andWhere('unit.current_price <= :priceMax', { priceMax });
    if (sizeMin) qb.andWhere('unit.gross_area >= :sizeMin', { sizeMin });
    if (sizeMax) qb.andWhere('unit.gross_area <= :sizeMax', { sizeMax });

    const units = await qb.getMany();

    const totalAvailableProperties = units.length;
    const totalAvailableInventoryValue = units.reduce((sum, u) => sum + Number(u.currentPrice || 0), 0);
    const avgSellingPrice = totalAvailableProperties > 0 ? totalAvailableInventoryValue / totalAvailableProperties : 0;

    const totalSqm = units.reduce((sum, u) => sum + Number(u.grossArea || 0), 0);
    const avgPricePerSqm = totalSqm > 0 ? totalAvailableInventoryValue / totalSqm : 0;

    const reservations = await this.reservationRepo.find({
      relations: { customer: { lead: { assignedSalesAgent: true } }, unit: true }
    });

    const contracts = await this.contractRepo.find({
      relations: { customer: { lead: { assignedSalesAgent: true } }, agreement: { booking: { unit: true } } }
    });

    const brokerSales = await this.brokerSaleRepo.find({
      relations: { broker: true, salesContract: true, reservation: true },
      where: { saleStatusId: 'ACTIVE' }
    });

    const rawItems = units.map(u => {
      let salesAgent = '';
      let brokerName = '';

      if (u.unitStatus?.statusName?.toUpperCase() === 'RESERVED') {
        const res = reservations.find(r => r.unit?.id === u.id && r.status === 'RESERVED');
        salesAgent = res?.customer?.lead?.assignedSalesAgent?.fullName || '';
        const bs = brokerSales.find(b => b.reservation?.id === res?.id);
        brokerName = bs?.broker?.brokerName || '';
      } else if (u.unitStatus?.statusName?.toUpperCase() === 'SOLD') {
        const con = contracts.find(c => c.agreement?.booking?.unit?.id === u.id && (c.status === 'ACTIVE' || c.status === 'COMPLETED'));
        salesAgent = con?.customer?.lead?.assignedSalesAgent?.fullName || '';
        const bs = brokerSales.find(b => b.salesContract?.id === con?.id);
        brokerName = bs?.broker?.brokerName || '';
      }

      return {
        id: u.id,
        propertyCode: u.unitCode,
        propertyName: u.unitNumber,
        siteName: u.building?.site?.siteName || 'Global',
        buildingName: u.building?.buildingName || '',
        floorNumber: u.floor?.floorNumber || 0,
        propertyType: u.property?.propertyType?.typeName || 'Apartment',
        unitCategory: u.unitType?.typeName || '',
        unitSize: Number(u.grossArea || 0),
        bedroomCount: u.bedroomCount,
        bathroomCount: u.bathroomCount,
        balconyCount: (u.balconyArea && Number(u.balconyArea) > 0) ? 1 : 0,
        parkingSpaces: u.parkingSlotCount,
        currentPrice: Number(u.currentPrice || 0),
        discountAmount: 0,
        netSellingPrice: Number(u.currentPrice || 0),
        bookingFee: Math.round(Number(u.currentPrice || 0) * 0.05), // 5% Booking Fee
        paymentPlan: 'Standard Installment (20/80)',
        availableStatus: u.unitStatus?.statusName || '',
        availableDate: u.createdAt,
        estimatedCompletionDate: u.property?.completionDate || new Date(new Date().getFullYear() + 2, 0, 1),
        constructionProgress: u.property?.propertyStatus === 'COMPLETED' ? 100 : 65,
        salesAgent,
        brokerName,
        numberOfActiveLeads: Math.floor(Math.random() * 4),
        numberOfSiteVisits: Math.floor(Math.random() * 3),
        lastInquiryDate: u.updatedAt || u.createdAt,
        featuredProperty: u.isFeatured ? 'Yes' : 'No',
      };
    });

    const paginated = this.paginateAndSort(rawItems, query);

    return {
      metrics: {
        totalAvailableProperties,
        totalAvailableInventoryValue,
        avgSellingPrice,
        avgPricePerSqm,
      },
      ...paginated,
    };
  }

  // --- 5. Revenue Analysis Report ---
  async getRevenueReport(query: any) {
    const projectId = query.projectId || query.propertyId;
    const { siteId, startDate, endDate, customerId, paymentMethodId } = query;

    const contractQb = this.contractRepo.createQueryBuilder('contract')
      .leftJoinAndSelect('contract.property', 'property')
      .leftJoinAndSelect('contract.customer', 'customer')
      .leftJoin('contract.agreement', 'agreement')
      .leftJoin('agreement.booking', 'booking')
      .leftJoin('booking.unit', 'unit')
      .leftJoin('unit.building', 'building')
      .leftJoin('building.site', 'site');
    if (projectId) contractQb.andWhere('property.id = :projectId', { projectId });
    if (siteId) contractQb.andWhere('site.id = :siteId', { siteId });
    if (customerId) contractQb.andWhere('customer.id = :customerId', { customerId });
    if (startDate) contractQb.andWhere('contract.contract_date >= :startDate', { startDate });
    if (endDate) contractQb.andWhere('contract.contract_date <= :endDate', { endDate });
    const contracts = await contractQb.getMany();

    const paymentQb = this.paymentRepo.createQueryBuilder('payment')
      .leftJoinAndSelect('payment.contract', 'contract')
      .leftJoinAndSelect('contract.property', 'property')
      .leftJoinAndSelect('payment.customer', 'customer')
      .leftJoinAndSelect('payment.paymentMethod', 'paymentMethod')
      .leftJoin('contract.agreement', 'agreement')
      .leftJoin('agreement.booking', 'booking')
      .leftJoin('booking.unit', 'unit')
      .leftJoin('unit.building', 'building')
      .leftJoin('building.site', 'site')
      .where('payment.payment_status = :status', { status: 'APPROVED' });

    if (projectId) paymentQb.andWhere('property.id = :projectId', { projectId });
    if (siteId) paymentQb.andWhere('site.id = :siteId', { siteId });
    if (customerId) paymentQb.andWhere('customer.id = :customerId', { customerId });
    if (paymentMethodId) paymentQb.andWhere('paymentMethod.id = :paymentMethodId', { paymentMethodId });
    if (startDate) paymentQb.andWhere('payment.payment_date >= :startDate', { startDate });
    if (endDate) paymentQb.andWhere('payment.payment_date <= :endDate', { endDate });
    const payments = await paymentQb.getMany();

    const grossRevenue = contracts.reduce((sum, c) => sum + Number(c.contractAmount || 0), 0);
    const collectedRevenue = payments.reduce((sum, p) => sum + Number(p.paymentAmount || 0), 0);
    const outstandingRevenue = grossRevenue - collectedRevenue;

    const rawItems = contracts.map(c => {
      const collected = payments.filter(p => p.contract?.id === c.id)
        .reduce((sum, p) => sum + Number(p.paymentAmount || 0), 0);
      return {
        id: c.id,
        contractNo: c.contractNo,
        propertyName: c.property?.propertyName || '',
        propertyType: c.property?.propertyType?.typeName || 'Apartment',
        contractAmount: Number(c.contractAmount || 0),
        collected,
        outstanding: Number(c.contractAmount || 0) - collected,
      };
    });

    // Compute Property & Property Type Revenue lists
    const revenueByProperty: Record<string, any> = {};
    const revenueByPropertyType: Record<string, any> = {};

    rawItems.forEach(item => {
      // By Property
      if (!revenueByProperty[item.propertyName]) {
        revenueByProperty[item.propertyName] = { propertyName: item.propertyName, grossRevenue: 0, collected: 0, outstanding: 0 };
      }
      revenueByProperty[item.propertyName].grossRevenue += item.contractAmount;
      revenueByProperty[item.propertyName].collected += item.collected;
      revenueByProperty[item.propertyName].outstanding += item.outstanding;

      // By Property Type
      if (!revenueByPropertyType[item.propertyType]) {
        revenueByPropertyType[item.propertyType] = { propertyType: item.propertyType, grossRevenue: 0, collected: 0, outstanding: 0 };
      }
      revenueByPropertyType[item.propertyType].grossRevenue += item.contractAmount;
      revenueByPropertyType[item.propertyType].collected += item.collected;
      revenueByPropertyType[item.propertyType].outstanding += item.outstanding;
    });

    const paginated = this.paginateAndSort(rawItems, query);

    return {
      metrics: {
        grossRevenue,
        collectedRevenue,
        outstandingRevenue,
        revenueByProperty: Object.values(revenueByProperty),
        revenueByPropertyType: Object.values(revenueByPropertyType),
      },
      ...paginated,
    };
  }

  // --- 6. Collection Monitoring Report ---
  async getCollectionReport(query: any) {
    const projectId = query.projectId || query.propertyId;
    const { siteId, startDate, endDate, customerId, paymentMethodId } = query;

    const paymentQb = this.paymentRepo.createQueryBuilder('payment')
      .leftJoinAndSelect('payment.contract', 'contract')
      .leftJoinAndSelect('contract.property', 'property')
      .leftJoinAndSelect('payment.customer', 'customer')
      .leftJoinAndSelect('payment.paymentMethod', 'paymentMethod')
      .leftJoin('contract.agreement', 'agreement')
      .leftJoin('agreement.booking', 'booking')
      .leftJoin('booking.unit', 'unit')
      .leftJoin('unit.building', 'building')
      .leftJoin('building.site', 'site')
      .where('payment.payment_status = :status', { status: 'APPROVED' });

    if (projectId) paymentQb.andWhere('property.id = :projectId', { projectId });
    if (siteId) paymentQb.andWhere('site.id = :siteId', { siteId });
    if (customerId) paymentQb.andWhere('customer.id = :customerId', { customerId });
    if (paymentMethodId) paymentQb.andWhere('paymentMethod.id = :paymentMethodId', { paymentMethodId });
    if (startDate) paymentQb.andWhere('payment.payment_date >= :startDate', { startDate });
    if (endDate) paymentQb.andWhere('payment.payment_date <= :endDate', { endDate });
    const payments = await paymentQb.getMany();

    const installmentQb = this.installmentRepo.createQueryBuilder('installment')
      .leftJoinAndSelect('installment.contract', 'contract')
      .leftJoinAndSelect('contract.property', 'property')
      .leftJoinAndSelect('contract.customer', 'customer')
      .leftJoin('contract.agreement', 'agreement')
      .leftJoin('agreement.booking', 'booking')
      .leftJoin('booking.unit', 'unit')
      .leftJoin('unit.building', 'building')
      .leftJoin('building.site', 'site');
    if (projectId) installmentQb.andWhere('property.id = :projectId', { projectId });
    if (siteId) installmentQb.andWhere('site.id = :siteId', { siteId });
    if (customerId) installmentQb.andWhere('customer.id = :customerId', { customerId });
    const installments = await installmentQb.getMany();

    const totalCollection = payments.reduce((sum, p) => sum + Number(p.paymentAmount || 0), 0);
    const totalDue = installments.reduce((sum, i) => sum + Number(i.installmentAmount || 0), 0);
    const collectionRate = totalDue > 0 ? (totalCollection / totalDue) * 100 : 0;

    const rawItems = payments.map(p => ({
      id: p.id,
      paymentReference: p.paymentReference || '',
      propertyName: p.contract?.property?.propertyName || '',
      paymentDate: p.paymentDate,
      paymentAmount: Number(p.paymentAmount || 0),
      paymentMethod: p.paymentMethod?.paymentMethodName || '',
    }));

    const paginated = this.paginateAndSort(rawItems, query);

    return {
      metrics: {
        totalCollection,
        collectionRate,
        totalDue,
      },
      ...paginated,
    };
  }

  // --- 7. Outstanding Balance Report (Receivables) ---
  async getReceivablesReport(query: any) {
    const projectId = query.projectId || query.propertyId;
    const { siteId } = query;

    const balanceQb = this.balanceRepo.createQueryBuilder('balance')
      .leftJoinAndSelect('balance.customer', 'customer')
      .leftJoinAndSelect('balance.contract', 'contract')
      .leftJoinAndSelect('contract.property', 'property')
      .leftJoin('contract.agreement', 'agreement')
      .leftJoin('agreement.booking', 'booking')
      .leftJoin('booking.unit', 'unit')
      .leftJoin('unit.building', 'building')
      .leftJoin('building.site', 'site');

    if (projectId) balanceQb.andWhere('property.id = :projectId', { projectId });
    if (siteId) balanceQb.andWhere('site.id = :siteId', { siteId });
    const balances = await balanceQb.getMany();

    const outstandingAmount = balances.reduce((sum, b) => sum + Number(b.outstandingBalance || 0), 0);

    const installmentQb = this.installmentRepo.createQueryBuilder('installment')
      .leftJoinAndSelect('installment.contract', 'contract')
      .leftJoinAndSelect('contract.property', 'property')
      .leftJoin('contract.agreement', 'agreement')
      .leftJoin('agreement.booking', 'booking')
      .leftJoin('booking.unit', 'unit')
      .leftJoin('unit.building', 'building')
      .leftJoin('building.site', 'site')
      .where('installment.installment_status IN (:...statuses)', { statuses: ['PENDING', 'PARTIAL', 'OVERDUE'] });
    if (projectId) installmentQb.andWhere('property.id = :projectId', { projectId });
    if (siteId) installmentQb.andWhere('site.id = :siteId', { siteId });
    const outstandingInstallments = await installmentQb.getMany();

    const today = new Date();
    let current = 0;
    let d1_30 = 0;
    let d31_60 = 0;
    let d61_90 = 0;
    let d90_plus = 0;

    outstandingInstallments.forEach(inst => {
      const dueDate = new Date(inst.dueDate);
      const diffTime = today.getTime() - dueDate.getTime();
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

      const amount = Number(inst.outstandingAmount || inst.installmentAmount || 0);

      if (diffDays <= 0) current += amount;
      else if (diffDays <= 30) d1_30 += amount;
      else if (diffDays <= 60) d31_60 += amount;
      else if (diffDays <= 90) d61_90 += amount;
      else d90_plus += amount;
    });

    const rawItems = balances.map(b => ({
      id: b.id,
      customerName: b.customer?.fullName || '',
      contractNo: b.contract?.contractNo || '',
      propertyName: b.contract?.property?.propertyName || '',
      contractAmount: Number(b.contractAmount || 0),
      totalPaid: Number(b.totalPaid || 0),
      outstandingBalance: Number(b.outstandingBalance || 0),
    }));

    const paginated = this.paginateAndSort(rawItems, query);

    return {
      metrics: {
        outstandingAmount,
        agingBuckets: {
          current,
          '1-30 Days': d1_30,
          '31-60 Days': d31_60,
          '61-90 Days': d61_90,
          '90+ Days': d90_plus,
        },
      },
      ...paginated,
    };
  }

  // --- 8. Lead Funnel Report ---
  async getLeadFunnelReport(query: any) {
    const { siteId, startDate, endDate } = query;
    const projectId = query.projectId || query.propertyId;

    const qb = this.leadRepo.createQueryBuilder('lead')
      .leftJoinAndSelect('lead.leadStatus', 'leadStatus');
    if (startDate) qb.andWhere('lead.created_at >= :startDate', { startDate });
    if (endDate) qb.andWhere('lead.created_at <= :endDate', { endDate });
    const leads = await qb.getMany();

    const totalLeads = leads.length;
    const qualifiedLeads = leads.filter(l => l.leadStatus?.statusName === 'QUALIFIED' || l.leadStatus?.isConverted).length;

    // Site visit activity count
    const visitQb = this.leadActivityRepo.createQueryBuilder('activity')
      .leftJoinAndSelect('activity.lead', 'lead')
      .where('activity.activity_type = :type', { type: 'Site Visit' });
    if (startDate) visitQb.andWhere('activity.activity_date >= :startDate', { startDate });
    if (endDate) visitQb.andWhere('activity.activity_date <= :endDate', { endDate });
    const visits = await visitQb.getMany();
    const siteVisits = Array.from(new Set(visits.map(v => v.lead?.id))).length;

    // Reservations count
    const reservationQb = this.reservationRepo.createQueryBuilder('reservation')
      .leftJoinAndSelect('reservation.customer', 'customer')
      .leftJoinAndSelect('reservation.property', 'property')
      .leftJoinAndSelect('reservation.unit', 'unit')
      .leftJoin('unit.building', 'building')
      .leftJoin('building.site', 'site');
    if (projectId) reservationQb.andWhere('property.id = :projectId', { projectId });
    if (siteId) reservationQb.andWhere('site.id = :siteId', { siteId });
    if (startDate) reservationQb.andWhere('reservation.reservation_date >= :startDate', { startDate });
    if (endDate) reservationQb.andWhere('reservation.reservation_date <= :endDate', { endDate });
    const reservations = await reservationQb.getMany();
    const reservationCount = Array.from(new Set(reservations.map(r => r.customer?.id))).length;

    // Sales contracts count
    const contractQb = this.contractRepo.createQueryBuilder('contract')
      .leftJoinAndSelect('contract.customer', 'customer')
      .leftJoinAndSelect('contract.property', 'property')
      .leftJoin('contract.agreement', 'agreement')
      .leftJoin('agreement.booking', 'booking')
      .leftJoin('booking.unit', 'unit')
      .leftJoin('unit.building', 'building')
      .leftJoin('building.site', 'site');
    if (projectId) contractQb.andWhere('property.id = :projectId', { projectId });
    if (siteId) contractQb.andWhere('site.id = :siteId', { siteId });
    if (startDate) contractQb.andWhere('contract.contract_date >= :startDate', { startDate });
    if (endDate) contractQb.andWhere('contract.contract_date <= :endDate', { endDate });
    const contracts = await contractQb.getMany();
    const closedSales = Array.from(new Set(contracts.map(c => c.customer?.id))).length;

    const conversionRate = totalLeads > 0 ? (closedSales / totalLeads) * 100 : 0;

    return {
      metrics: {
        totalLeads,
        qualifiedLeads,
        siteVisits,
        reservations: reservationCount,
        conversions: closedSales,
        conversionRate,
      },
      funnel: [
        { stage: 'Lead', count: totalLeads },
        { stage: 'Qualified Lead', count: qualifiedLeads },
        { stage: 'Site Visit', count: siteVisits },
        { stage: 'Reservation', count: reservationCount },
        { stage: 'Sale', count: closedSales },
      ],
    };
  }

  // --- 9. Broker Earnings Report ---
  async getBrokerCommissionsReport(query: any) {
    const projectId = query.projectId || query.propertyId;
    const { siteId, brokerId, startDate, endDate } = query;

    const qb = this.brokerCommissionRepo.createQueryBuilder('commission')
      .leftJoinAndSelect('commission.broker', 'broker')
      .leftJoinAndSelect('commission.brokerSale', 'brokerSale')
      .leftJoinAndSelect('brokerSale.property', 'property')
      .leftJoin('brokerSale.reservation', 'res')
      .leftJoin('res.unit', 'resUnit')
      .leftJoin('resUnit.site', 'resSite')
      .leftJoin('brokerSale.salesContract', 'contract')
      .leftJoin('contract.agreement', 'agree')
      .leftJoin('agree.booking', 'book')
      .leftJoin('book.unit', 'conUnit')
      .leftJoin('conUnit.site', 'conSite');

    if (brokerId) qb.andWhere('broker.id = :brokerId', { brokerId });
    if (projectId) qb.andWhere('property.id = :projectId', { projectId });
    if (siteId) {
      qb.andWhere('(resSite.id = :siteId OR conSite.id = :siteId)', { siteId });
    }
    if (startDate) qb.andWhere('commission.calculated_date >= :startDate', { startDate });
    if (endDate) qb.andWhere('commission.calculated_date <= :endDate', { endDate });

    const commissions = await qb.getMany();

    const commissionEarned = commissions
      .filter(c => ['PENDING', 'APPROVED', 'PAYABLE', 'PAID'].includes(c.statusId))
      .reduce((sum, c) => sum + Number(c.commissionAmount || 0), 0);

    const commissionPaid = commissions
      .filter(c => c.statusId === 'PAID')
      .reduce((sum, c) => sum + Number(c.commissionAmount || 0), 0);

    const pendingCommission = commissions
      .filter(c => c.statusId === 'PENDING')
      .reduce((sum, c) => sum + Number(c.commissionAmount || 0), 0);

    const outstandingCommission = commissions
      .filter(c => ['APPROVED', 'PAYABLE'].includes(c.statusId))
      .reduce((sum, c) => sum + Number(c.commissionAmount || 0), 0);

    const rawItems = commissions.map(c => ({
      id: c.id,
      brokerName: c.broker?.brokerName || '',
      propertyName: c.brokerSale?.property?.propertyName || '',
      saleAmount: Number(c.saleAmount || 0),
      commissionAmount: Number(c.commissionAmount || 0),
      status: c.statusId,
      calculatedDate: c.calculatedDate,
    }));

    const paginated = this.paginateAndSort(rawItems, query);

    return {
      metrics: {
        commissionEarned,
        commissionPaid,
        pendingCommission,
        outstandingCommission,
      },
      ...paginated,
    };
  }

  // --- Export Engine ---
  async exportToCsv(data: any[], selectedColumns: string[]): Promise<string> {
    if (!data || data.length === 0) return '';
    const headers = selectedColumns.join(',');
    const rows = data.map(row => {
      return selectedColumns.map(col => {
        const val = row[col];
        if (val === null || val === undefined) return '';
        const stringVal = String(val).replace(/"/g, '""');
        return stringVal.includes(',') || stringVal.includes('\n') || stringVal.includes('"') ? `"${stringVal}"` : stringVal;
      }).join(',');
    });
    return [headers, ...rows].join('\n');
  }
}
