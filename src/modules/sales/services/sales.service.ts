import { Injectable, NotFoundException, BadRequestException, Logger, OnModuleInit } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { FinanceService } from '../../finance/services/finance.service';
import { Customer } from '../../crm/entities/customer.entity';
import { Lead } from '../../crm/entities/lead.entity';
import { SalesAgent } from '../../crm/entities/sales-agent.entity';
import { Property } from '../../properties/entities/property.entity';
import { Unit } from '../../properties/entities/unit.entity';
import { UnitStatus } from '../../properties/entities/unit-status.entity';
import { UnitStatusHistory } from '../../properties/entities/unit-status-history.entity';
import { UnitPrice } from '../../properties/entities/unit-price.entity';
import { PricePromotion } from '../../properties/entities/price-promotion.entity';

// Sales Entities
import { SalesReservation } from '../entities/sales-reservation.entity';
import { SalesReservationExtension } from '../entities/sales-reservation-extension.entity';
import { SalesQuotation } from '../entities/sales-quotation.entity';
import { SalesQuotationItem } from '../entities/sales-quotation-item.entity';
import { SalesBooking } from '../entities/sales-booking.entity';
import { SalesAgreement } from '../entities/sales-agreement.entity';
import { SalesContract } from '../entities/sales-contract.entity';
import { SalesContractDocument } from '../entities/sales-contract-document.entity';
import { InstallmentSchedule } from '../entities/installment-schedule.entity';
import { DiscountRequest } from '../entities/discount-request.entity';
import { DiscountApprovalHistory } from '../entities/discount-approval-history.entity';
import { SalesCommissionRule } from '../entities/sales-commission-rule.entity';
import { SalesCommission } from '../entities/sales-commission.entity';
import { SalesAuditLog } from '../entities/sales-audit-log.entity';

// DTOs
import {
  CreateCustomerDto,
  UpdateCustomerDto,
  CreateReservationDto,
  ExtendReservationDto,
  CreateQuotationDto,
  CreateBookingDto,
  CreateAgreementDto,
  CreateContractDto,
  CreateInstallmentPlanDto,
  CreateDiscountRequestDto,
  CreateCommissionRuleDto,
  CreateCommissionDto,
} from '../dto/sales.dto';

@Injectable()
export class SalesService implements OnModuleInit {
  private readonly logger = new Logger(SalesService.name);

  onModuleInit() {
    this.logger.log('SalesModule Service initialized. Scheduling daily reservation expiry sweeps...');
    
    // Retroactively update status of agreements and quotations
    this.syncExistingStatuses()
      .then(() => this.logger.log('Existing database statuses synced successfully.'))
      .catch((err) => this.logger.error('Failed to sync existing database statuses', err));

    // Run Sweep every 12 hours
    setInterval(() => {
      this.processExpiredReservations()
        .then(() => this.logger.log('Periodic reservation expiry sweep completed successfully.'))
        .catch((err) => this.logger.error('Failed to run periodic reservation expiry sweep', err));
    }, 12 * 60 * 60 * 1000);
  }

  private async syncExistingStatuses() {
    try {
      // 1. Sync agreements to ACTIVE if contract is executed
      const activeContracts = await this.contractRepo.find({ relations: { agreement: true } });
      for (const contract of activeContracts) {
        if (contract.agreement && contract.agreement.status !== 'ACTIVE') {
          contract.agreement.status = 'ACTIVE';
          await this.agreementRepo.save(contract.agreement);
          this.logger.log(`Retroactively marked agreement ${contract.agreement.agreementNo} as ACTIVE due to executed contract ${contract.contractNo}`);
        }
      }

      // 2. Sync quotations to ACCEPTED if booking is approved
      const approvedBookings = await this.bookingRepo.find({ 
        where: { status: 'APPROVED' }, 
        relations: { quotation: true } 
      });
      for (const booking of approvedBookings) {
        if (booking.quotation && booking.quotation.status !== 'ACCEPTED') {
          booking.quotation.status = 'ACCEPTED';
          await this.quotationRepo.save(booking.quotation);
          this.logger.log(`Retroactively marked quotation ${booking.quotation.quotationNo} as ACCEPTED due to approved booking ${booking.bookingNo}`);
        }
      }
    } catch (err) {
      this.logger.error('Failed to sync existing database statuses', err);
    }
  }

  constructor(
    @InjectRepository(Customer) private readonly customerRepo: Repository<Customer>,
    @InjectRepository(Lead) private readonly leadRepo: Repository<Lead>,
    @InjectRepository(SalesAgent) private readonly agentRepo: Repository<SalesAgent>,
    @InjectRepository(Property) private readonly propertyRepo: Repository<Property>,
    @InjectRepository(Unit) private readonly unitRepo: Repository<Unit>,
    @InjectRepository(UnitStatus) private readonly unitStatusRepo: Repository<UnitStatus>,
    @InjectRepository(UnitStatusHistory) private readonly unitStatusHistoryRepo: Repository<UnitStatusHistory>,
    @InjectRepository(UnitPrice) private readonly unitPriceRepo: Repository<UnitPrice>,
    @InjectRepository(PricePromotion) private readonly promotionRepo: Repository<PricePromotion>,

    @InjectRepository(SalesReservation) private readonly reservationRepo: Repository<SalesReservation>,
    @InjectRepository(SalesReservationExtension) private readonly extensionRepo: Repository<SalesReservationExtension>,
    @InjectRepository(SalesQuotation) private readonly quotationRepo: Repository<SalesQuotation>,
    @InjectRepository(SalesQuotationItem) private readonly quotationItemRepo: Repository<SalesQuotationItem>,
    @InjectRepository(SalesBooking) private readonly bookingRepo: Repository<SalesBooking>,
    @InjectRepository(SalesAgreement) private readonly agreementRepo: Repository<SalesAgreement>,
    @InjectRepository(SalesContract) private readonly contractRepo: Repository<SalesContract>,
    @InjectRepository(SalesContractDocument) private readonly contractDocRepo: Repository<SalesContractDocument>,
    @InjectRepository(InstallmentSchedule) private readonly scheduleRepo: Repository<InstallmentSchedule>,
    @InjectRepository(DiscountRequest) private readonly discountRepo: Repository<DiscountRequest>,
    @InjectRepository(DiscountApprovalHistory) private readonly approvalRepo: Repository<DiscountApprovalHistory>,
    @InjectRepository(SalesCommissionRule) private readonly commRuleRepo: Repository<SalesCommissionRule>,
    @InjectRepository(SalesCommission) private readonly commissionRepo: Repository<SalesCommission>,
    @InjectRepository(SalesAuditLog) private readonly auditLogRepo: Repository<SalesAuditLog>,
    private readonly financeService: FinanceService,
  ) {}

  // --- Customer CRUD & Conversion Workflow ---

  async createCustomer(dto: CreateCustomerDto): Promise<Customer> {
    // Check if customer with this phone number already exists and is active
    const existing = await this.customerRepo.findOne({
      where: { primaryPhone: dto.primaryPhone, isDeleted: false }
    });
    if (existing) {
      throw new BadRequestException('A customer with this phone number already exists.');
    }

    let lead: Lead | null = null;
    if (dto.leadId) {
      lead = await this.leadRepo.findOne({ where: { id: dto.leadId } });
      if (lead) {
        lead.remarks = (lead.remarks || '') + '\nConverted to Customer.';
        await this.leadRepo.save(lead);
      }
    }
    const customer = this.customerRepo.create({
      fullName: dto.fullName,
      primaryPhone: dto.primaryPhone,
      primaryEmail: dto.primaryEmail,
      nationality: dto.nationality,
      lead,
    });
    return this.customerRepo.save(customer);
  }

  async findAllCustomers(): Promise<Customer[]> {
    return this.customerRepo.find({ where: { isDeleted: false }, order: { createdAt: 'DESC' } });
  }

  async findOneCustomer(id: number): Promise<Customer> {
    const customer = await this.customerRepo.findOne({ where: { id, isDeleted: false } });
    if (!customer) throw new NotFoundException('Customer not found');
    return customer;
  }

  async updateCustomer(id: number, dto: UpdateCustomerDto): Promise<Customer> {
    const customer = await this.findOneCustomer(id);

    if (dto.primaryPhone && dto.primaryPhone !== customer.primaryPhone) {
      const existing = await this.customerRepo.findOne({
        where: { primaryPhone: dto.primaryPhone, isDeleted: false }
      });
      if (existing && existing.id !== customer.id) {
        throw new BadRequestException('A customer with this phone number already exists.');
      }
      customer.primaryPhone = dto.primaryPhone;
    }

    if (dto.fullName !== undefined) customer.fullName = dto.fullName;
    if (dto.primaryEmail !== undefined) customer.primaryEmail = dto.primaryEmail;
    if (dto.nationality !== undefined) customer.nationality = dto.nationality;

    return this.customerRepo.save(customer);
  }

  async deleteCustomer(id: number): Promise<{ success: boolean }> {
    const customer = await this.findOneCustomer(id);

    // Block deletion if the customer has any active transaction records linked to units
    const [hasReservation, hasBooking, hasContract, hasQuotation, hasAgreement] = await Promise.all([
      this.reservationRepo.findOne({ where: { customer: { id } } }),
      this.bookingRepo.findOne({ where: { customer: { id } } }),
      this.contractRepo.findOne({ where: { customer: { id } } }),
      this.quotationRepo.findOne({ where: { customer: { id } } }),
      this.agreementRepo.findOne({ where: { customer: { id } } }),
    ]);

    if (hasReservation || hasBooking || hasContract || hasQuotation || hasAgreement) {
      throw new BadRequestException(
        'Cannot delete customer because they are connected to active/past unit reservations, quotations, bookings, agreements, or contracts.'
      );
    }

    customer.isDeleted = true;
    await this.customerRepo.save(customer);
    return { success: true };
  }

  // --- Reservation Management ---

  async createReservation(dto: CreateReservationDto): Promise<SalesReservation> {
    const customer = await this.customerRepo.findOne({ where: { id: dto.customerId } });
    if (!customer) throw new NotFoundException('Customer not found');

    const property = await this.propertyRepo.findOne({ where: { id: dto.propertyId } });
    if (!property) throw new NotFoundException('Property not found');

    const unit = await this.unitRepo.findOne({ where: { id: dto.unitId }, relations: { unitStatus: true } });
    if (!unit) throw new NotFoundException('Unit not found');

    if (unit.unitStatus.statusName !== 'Available') {
      throw new BadRequestException(`Unit is not available for reservation (Current Status: ${unit.unitStatus.statusName})`);
    }

    const refNo = 'RES-' + Date.now().toString().slice(-8);

    const reservation = this.reservationRepo.create({
      reservationNo: refNo,
      customer,
      property,
      unit,
      reservationDate: dto.reservationDate,
      expiryDate: dto.expiryDate,
      reservationFee: dto.reservationFee || 0,
      status: 'RESERVED',
      remarks: dto.remarks,
    });

    const savedReservation = await this.reservationRepo.save(reservation);

    // Update unit status to Reserved
    const reservedStatus = await this.unitStatusRepo.findOne({ where: { statusName: 'Reserved' } });
    if (reservedStatus) {
      const oldStatus = unit.unitStatus;
      unit.unitStatus = reservedStatus;
      unit.reservationExpiry = dto.expiryDate;
      await this.unitRepo.save(unit);

      // Status history
      const history = this.unitStatusHistoryRepo.create({
        unit,
        oldStatus,
        newStatus: reservedStatus,
        reason: `Unit reserved ref: ${refNo}`,
      });
      await this.unitStatusHistoryRepo.save(history);
    }

    await this.logAudit('SalesReservation', savedReservation.id, 'CREATE', null, savedReservation);

    return savedReservation;
  }

  async extendReservation(dto: ExtendReservationDto): Promise<SalesReservationExtension> {
    const reservation = await this.reservationRepo.findOne({ where: { id: dto.reservationId } });
    if (!reservation) throw new NotFoundException('Reservation not found');

    const extension = this.extensionRepo.create({
      reservation,
      previousExpiryDate: reservation.expiryDate,
      newExpiryDate: dto.newExpiryDate,
      reason: dto.reason,
    });

    const savedExtension = await this.extensionRepo.save(extension);

    // Update reservation expiry date
    reservation.expiryDate = dto.newExpiryDate;
    await this.reservationRepo.save(reservation);

    // Update unit reservation expiry date
    const unit = await this.unitRepo.findOne({ where: { id: reservation.unit.id } });
    if (unit) {
      unit.reservationExpiry = dto.newExpiryDate;
      await this.unitRepo.save(unit);
    }

    return savedExtension;
  }

  async cancelReservation(id: number): Promise<SalesReservation> {
    const reservation = await this.reservationRepo.findOne({ where: { id }, relations: { unit: true } });
    if (!reservation) throw new NotFoundException('Reservation not found');

    const oldValue = { ...reservation };
    reservation.status = 'CANCELLED';
    const saved = await this.reservationRepo.save(reservation);

    // Release unit to Available
    const availableStatus = await this.unitStatusRepo.findOne({ where: { statusName: 'Available' } });
    const unit = await this.unitRepo.findOne({ where: { id: reservation.unit.id }, relations: { unitStatus: true } });
    if (unit && availableStatus) {
      const oldStatus = unit.unitStatus;
      unit.unitStatus = availableStatus;
      unit.reservationExpiry = null;
      await this.unitRepo.save(unit);

      // Log status history
      const history = this.unitStatusHistoryRepo.create({
        unit,
        oldStatus,
        newStatus: availableStatus,
        reason: `Reservation cancelled ref: ${reservation.reservationNo}`,
      });
      await this.unitStatusHistoryRepo.save(history);
    }

    await this.logAudit('SalesReservation', saved.id, 'CANCEL', oldValue, saved);

    return saved;
  }

  async processExpiredReservations(): Promise<void> {
    const today = new Date();
    const expiredReservations = await this.reservationRepo.find({
      where: { status: 'RESERVED' },
      relations: { unit: true },
    });

    const availableStatus = await this.unitStatusRepo.findOne({ where: { statusName: 'Available' } });

    for (const res of expiredReservations) {
      if (new Date(res.expiryDate) < today) {
        res.status = 'EXPIRED';
        await this.reservationRepo.save(res);

        if (res.unit && availableStatus) {
          const unit = await this.unitRepo.findOne({ where: { id: res.unit.id }, relations: { unitStatus: true } });
          if (unit && unit.unitStatus.statusName === 'Reserved') {
            const oldStatus = unit.unitStatus;
            unit.unitStatus = availableStatus;
            unit.reservationExpiry = null;
            await this.unitRepo.save(unit);

            const history = this.unitStatusHistoryRepo.create({
              unit,
              oldStatus,
              newStatus: availableStatus,
              reason: `Reservation expired ref: ${res.reservationNo}`,
            });
            await this.unitStatusHistoryRepo.save(history);
          }
        }
      }
    }
  }

  async findAllReservations(): Promise<SalesReservation[]> {
    return this.reservationRepo.find({ order: { createdAt: 'DESC' } });
  }

  // --- Quotation & Pricing Engine ---

  async calculateQuotationPrice(propertyId: number, unitId: number): Promise<any> {
    const unit = await this.unitRepo.findOne({ where: { id: unitId }, relations: { unitType: true } });
    if (!unit) throw new NotFoundException('Unit not found');

    const basePrice = Number(unit.currentPrice || 0);
    let appliedDiscount = 0;
    let appliedRule = 'Standard Base Valuation Price (No Discount)';

    const today = new Date().toISOString().split('T')[0];

    // Priority 1: Check active promotions
    const activePromotions = await this.promotionRepo.createQueryBuilder('promo')
      .where('promo.isActive = :isActive', { isActive: true })
      .andWhere('(promo.startDate <= :today OR promo.startDate IS NULL)', { today })
      .andWhere('(promo.endDate >= :today OR promo.endDate IS NULL)', { today })
      .andWhere('(promo.applicableProperty = :propertyId OR promo.applicableProperty IS NULL)', { propertyId })
      .andWhere('(promo.applicableUnitType = :unitTypeId OR promo.applicableUnitType IS NULL)', { unitTypeId: unit.unitType?.id })
      .getMany();

    if (activePromotions.length > 0) {
      const activePromo = activePromotions[0]; // Take first active promotion
      if (activePromo.discountPercentage && Number(activePromo.discountPercentage) > 0) {
        appliedDiscount = basePrice * (Number(activePromo.discountPercentage) / 100);
        appliedRule = `Promotion: ${activePromo.promotionName} (${activePromo.discountPercentage}% Discount applied)`;
      } else if (activePromo.fixedDiscountAmount && Number(activePromo.fixedDiscountAmount) > 0) {
        appliedDiscount = Number(activePromo.fixedDiscountAmount);
        appliedRule = `Promotion: ${activePromo.promotionName} (Flat Discount of ETB ${activePromo.fixedDiscountAmount} applied)`;
      }
    } else {
      // Priority 2: Check unit specific discount
      const activePrice = await this.unitPriceRepo.findOne({
        where: { unit: { id: unitId }, isActive: true },
      });

      if (activePrice) {
        const percent = Number(activePrice.discountPercentage || 0);
        if (percent > 0) {
          appliedDiscount = basePrice * (percent / 100);
          appliedRule = `Unit Price Sheet Discount (${percent}% Discount applied)`;
        }
      }
    }

    const priceAfterDiscount = Math.max(0, basePrice - appliedDiscount);
    const vat = priceAfterDiscount * 0.15; // Standard 15% VAT
    const finalPrice = priceAfterDiscount + vat;

    return {
      basePrice,
      discountAmount: appliedDiscount,
      vatAmount: vat,
      totalAmount: finalPrice,
      appliedRule,
      appliedRuleDescription: appliedRule,
    };
  }

  async createQuotation(dto: CreateQuotationDto): Promise<SalesQuotation> {
    if (dto.basePrice >= 1e16 || (dto.discountAmount || 0) >= 1e16 || (dto.vatAmount || 0) >= 1e16) {
      throw new BadRequestException('Quotation amount values exceed maximum permitted precision (16 digits).');
    }
    const customer = await this.customerRepo.findOne({ where: { id: dto.customerId } });
    if (!customer) throw new NotFoundException('Customer not found');

    const property = await this.propertyRepo.findOne({ where: { id: dto.propertyId } });
    const unit = await this.unitRepo.findOne({ where: { id: dto.unitId } });
    const reservation = dto.reservationId ? await this.reservationRepo.findOne({ where: { id: dto.reservationId } }) : null;

    const refNo = 'QT-' + Date.now().toString().slice(-8);

    const quotation = this.quotationRepo.create({
      quotationNo: refNo,
      customer,
      reservation,
      property,
      unit,
      quotationDate: dto.quotationDate,
      validityDate: dto.validityDate,
      basePrice: dto.basePrice,
      discountAmount: dto.discountAmount || 0,
      vatAmount: dto.vatAmount || 0,
      totalAmount: dto.basePrice - (dto.discountAmount || 0) + (dto.vatAmount || 0),
      status: 'DRAFT',
      remarks: dto.remarks,
      items: [],
    });

    const savedQuotation = await this.quotationRepo.save(quotation);

    if (dto.items && dto.items.length > 0) {
      const items = dto.items.map((i) =>
        this.quotationItemRepo.create({
          quotation: savedQuotation,
          description: i.description,
          quantity: i.quantity,
          unitPrice: i.unitPrice,
          amount: Number(i.quantity) * Number(i.unitPrice),
        }),
      );
      savedQuotation.items = await this.quotationItemRepo.save(items);
    }

    return savedQuotation;
  }

  async findAllQuotations(): Promise<SalesQuotation[]> {
    return this.quotationRepo.find({ order: { quotationDate: 'DESC' } });
  }

  // --- Booking Management ---

  async createBooking(dto: CreateBookingDto): Promise<SalesBooking> {
    if (dto.bookingAmount >= 1e16) {
      throw new BadRequestException('Booking amount exceeds maximum permitted precision (16 digits).');
    }
    const customer = await this.customerRepo.findOne({ where: { id: dto.customerId } });
    if (!customer) throw new NotFoundException('Customer not found');

    const property = await this.propertyRepo.findOne({ where: { id: dto.propertyId } });
    if (!property) throw new NotFoundException('Property not found');

    const unit = await this.unitRepo.findOne({ where: { id: dto.unitId } });
    if (!unit) throw new NotFoundException('Unit not found');

    const reservation = dto.reservationId ? await this.reservationRepo.findOne({ where: { id: dto.reservationId } }) : null;
    const quotation = dto.quotationId ? await this.quotationRepo.findOne({ where: { id: dto.quotationId } }) : null;

    const refNo = 'BKG-' + Date.now().toString().slice(-8);

    const booking = this.bookingRepo.create({
      bookingNo: refNo,
      reservation,
      quotation,
      customer,
      property,
      unit,
      bookingDate: dto.bookingDate,
      bookingAmount: dto.bookingAmount,
      status: 'PENDING',
    });

    const savedBooking = await this.bookingRepo.save(booking);

    // If reservation exists, update its status
    if (reservation) {
      reservation.status = 'CONVERTED_TO_BOOKING';
      await this.reservationRepo.save(reservation);
    }

    return savedBooking;
  }

  async approveBooking(id: number, approverId: number): Promise<SalesBooking> {
    const booking = await this.bookingRepo.findOne({ 
      where: { id }, 
      relations: { unit: true, quotation: true } 
    });
    if (!booking) throw new NotFoundException('Booking not found');

    const oldValue = { ...booking };
    booking.status = 'APPROVED';
    booking.approvedBy = approverId;
    booking.approvedAt = new Date();

    const saved = await this.bookingRepo.save(booking);

    // Transition linked quotation status to ACCEPTED
    if (booking.quotation) {
      booking.quotation.status = 'ACCEPTED';
      await this.quotationRepo.save(booking.quotation);
    }

    // Transition unit status to Sold
    const soldStatus = await this.unitStatusRepo.findOne({ where: { statusName: 'Sold' } });
    const unit = await this.unitRepo.findOne({ where: { id: booking.unit.id }, relations: { unitStatus: true } });
    if (unit && soldStatus) {
      const oldStatus = unit.unitStatus;
      unit.unitStatus = soldStatus;
      unit.reservationExpiry = null;
      unit.soldDate = new Date();
      await this.unitRepo.save(unit);

      const history = this.unitStatusHistoryRepo.create({
        unit,
        oldStatus,
        newStatus: soldStatus,
        reason: `Booking approved ref: ${booking.bookingNo}`,
      });
      await this.unitStatusHistoryRepo.save(history);
    }

    await this.logAudit('SalesBooking', saved.id, 'APPROVE', oldValue, saved);

    return saved;
  }

  async cancelBooking(id: number): Promise<SalesBooking> {
    const booking = await this.bookingRepo.findOne({ where: { id }, relations: { unit: true } });
    if (!booking) throw new NotFoundException('Booking not found');

    const oldValue = { ...booking };
    booking.status = 'CANCELLED';
    const saved = await this.bookingRepo.save(booking);

    // Return unit to Available
    const availableStatus = await this.unitStatusRepo.findOne({ where: { statusName: 'Available' } });
    const unit = await this.unitRepo.findOne({ where: { id: booking.unit.id }, relations: { unitStatus: true } });
    if (unit && availableStatus) {
      const oldStatus = unit.unitStatus;
      unit.unitStatus = availableStatus;
      unit.soldDate = null;
      await this.unitRepo.save(unit);

      const history = this.unitStatusHistoryRepo.create({
        unit,
        oldStatus,
        newStatus: availableStatus,
        reason: `Booking cancelled ref: ${booking.bookingNo}`,
      });
      await this.unitStatusHistoryRepo.save(history);
    }

    await this.logAudit('SalesBooking', saved.id, 'CANCEL', oldValue, saved);

    return saved;
  }

  async findAllBookings(): Promise<SalesBooking[]> {
    return this.bookingRepo.find({ order: { bookingDate: 'DESC' } });
  }

  // --- Agreement & Contract Management ---

  async createAgreement(dto: CreateAgreementDto): Promise<SalesAgreement> {
    const booking = await this.bookingRepo.findOne({ where: { id: dto.bookingId } });
    if (!booking) throw new NotFoundException('Booking not found');

    const customer = await this.customerRepo.findOne({ where: { id: dto.customerId } });
    if (!customer) throw new NotFoundException('Customer not found');

    const refNo = 'AGR-' + Date.now().toString().slice(-8);

    const agreement = this.agreementRepo.create({
      agreementNo: refNo,
      booking,
      customer,
      agreementDate: dto.agreementDate,
      agreementVersion: dto.agreementVersion || 1,
      agreementDocument: dto.agreementDocument,
      status: 'DRAFT',
    });

    return this.agreementRepo.save(agreement);
  }

  async findAllAgreements(): Promise<SalesAgreement[]> {
    return this.agreementRepo.find({ order: { agreementDate: 'DESC' } });
  }

  async createContract(dto: CreateContractDto): Promise<SalesContract> {
    if (dto.contractAmount >= 1e16) {
      throw new BadRequestException('Contract amount exceeds maximum permitted precision (16 digits).');
    }
    const agreement = await this.agreementRepo.findOne({ where: { id: dto.agreementId } });
    if (!agreement) throw new NotFoundException('Agreement not found');

    const customer = await this.customerRepo.findOne({ where: { id: dto.customerId } });
    if (!customer) throw new NotFoundException('Customer not found');

    const refNo = 'CON-' + Date.now().toString().slice(-8);

    const contract = this.contractRepo.create({
      agreement,
      customer,
      contractNo: refNo,
      contractStartDate: dto.contractStartDate,
      contractEndDate: dto.contractEndDate,
      contractAmount: dto.contractAmount,
      status: 'ACTIVE',
    });

    const savedContract = await this.contractRepo.save(contract);

    // Transition underlying sales agreement status to ACTIVE
    agreement.status = 'ACTIVE';
    await this.agreementRepo.save(agreement);

    // Transition booking status and update unit status to Sold
    if (agreement.booking) {
      const booking = await this.bookingRepo.findOne({
        where: { id: agreement.booking.id },
        relations: { unit: { unitStatus: true } }
      });
      if (booking) {
        booking.status = 'CONTRACT_CREATED';
        await this.bookingRepo.save(booking);

        if (booking.unit) {
          const unit = booking.unit;
          const oldStatus = unit.unitStatus;
          const soldStatus = await this.unitStatusRepo.findOne({ where: { statusName: 'Sold' } });
          if (soldStatus && (!oldStatus || oldStatus.statusName !== 'Sold')) {
            unit.unitStatus = soldStatus;
            unit.reservationExpiry = null;
            unit.soldDate = new Date();
            await this.unitRepo.save(unit);

            // Log unit status history
            const history = this.unitStatusHistoryRepo.create({
              unit,
              oldStatus,
              newStatus: soldStatus,
              reason: `Unit sold. Contract ${refNo} executed.`,
            });
            await this.unitStatusHistoryRepo.save(history);
          }
        }
      }
    }

    // Automatically trigger commission calculations when contract becomes active
    await this.calculateCommissions(savedContract.id);

    return savedContract;
  }

  async uploadContractDocument(contractId: number, fileName: string, filePath: string): Promise<SalesContractDocument> {
    const contract = await this.contractRepo.findOne({ where: { id: contractId } });
    if (!contract) throw new NotFoundException('Contract not found');

    const doc = this.contractDocRepo.create({
      contract,
      fileName,
      filePath,
    });
    return this.contractDocRepo.save(doc);
  }

  async removeContractDocument(docId: number): Promise<{ success: boolean }> {
    const doc = await this.contractDocRepo.findOne({ where: { id: docId } });
    if (!doc) throw new NotFoundException('Document not found');
    await this.contractDocRepo.remove(doc);
    return { success: true };
  }

  async findAllContracts(): Promise<SalesContract[]> {
    return this.contractRepo.find({ order: { createdAt: 'DESC' } });
  }

  // --- Installment Plan & Scheduler ---

  async generateInstallmentPlan(dto: CreateInstallmentPlanDto): Promise<any> {
    if (dto.totalContractAmount >= 1e16 || dto.downPayment >= 1e16) {
      throw new BadRequestException('Installment plan amount values exceed maximum permitted precision (16 digits).');
    }
    const contract = await this.contractRepo.findOne({
      where: { id: dto.contractId },
      relations: { property: true, customer: true }
    });
    if (!contract) throw new NotFoundException('Contract not found');

    const existingScheduleCount = await this.scheduleRepo.count({
      where: { contract: { id: dto.contractId } }
    });
    if (existingScheduleCount > 0) {
      throw new BadRequestException('An installment schedule plan has already been generated for this contract.');
    }

    // Save installment parameters directly to the contract
    contract.downPayment = dto.downPayment;
    contract.totalInstallments = dto.numberOfInstallments;
    contract.installmentFrequency = dto.installmentFrequency;
    await this.contractRepo.save(contract);

    // Automatically record down payment if requested
    if (dto.recordPayment && dto.downPayment > 0 && dto.paymentMethodId) {
      await this.financeService.createPayment({
        contractId: dto.contractId,
        customerId: contract.customer?.id,
        paymentMethodId: dto.paymentMethodId,
        paymentDate: dto.paymentDate || new Date().toISOString().split('T')[0],
        paymentAmount: dto.downPayment,
        paymentReference: dto.paymentReference,
        bankName: dto.bankName,
        transactionReference: dto.transactionReference,
        chequeNumber: dto.chequeNumber,
        remarks: dto.remarks || 'Down payment automatically registered upon plan generation.',
      });
    }

    // Calculate installment amount
    const remainingAmount = Number(dto.totalContractAmount) - Number(dto.downPayment);
    const installmentAmt = remainingAmount / dto.numberOfInstallments;

    const schedules: InstallmentSchedule[] = [];
    const baseDate = new Date();

    for (let i = 1; i <= dto.numberOfInstallments; i++) {
      const dueDate = new Date();
      if (dto.installmentFrequency === 'MONTHLY') {
        dueDate.setMonth(baseDate.getMonth() + i);
      } else if (dto.installmentFrequency === 'QUARTERLY') {
        dueDate.setMonth(baseDate.getMonth() + i * 3);
      } else if (dto.installmentFrequency === 'YEARLY') {
        dueDate.setFullYear(baseDate.getFullYear() + i);
      }

      const schedule = this.scheduleRepo.create({
        contract,
        installmentNo: i,
        dueDate,
        installmentAmount: installmentAmt,
        outstandingAmount: installmentAmt,
        status: 'PENDING',
      });
      schedules.push(schedule);
    }

    const savedSchedules = await this.scheduleRepo.save(schedules);

    return {
      id: contract.id,
      contract,
      installmentFrequency: contract.installmentFrequency,
      numberOfInstallments: contract.totalInstallments,
      totalContractAmount: contract.contractAmount,
      downPayment: contract.downPayment,
      schedules: savedSchedules
    };
  }

  async getInstallmentPlans(): Promise<any[]> {
    const contracts = await this.contractRepo.find({
      relations: { customer: true, property: true },
      order: { createdAt: 'DESC' }
    });

    const results: any[] = [];
    for (const contract of contracts) {
      const schedules = await this.scheduleRepo.find({
        where: { contract: { id: contract.id } },
        order: { installmentNo: 'ASC' }
      });
      if (schedules.length > 0) {
        results.push({
          id: contract.id,
          contract,
          installmentFrequency: contract.installmentFrequency,
          numberOfInstallments: contract.totalInstallments,
          totalContractAmount: contract.contractAmount,
          downPayment: contract.downPayment,
          schedules
        });
      }
    }
    return results;
  }

  async payInstallment(scheduleId: number, paidAmount: number): Promise<InstallmentSchedule> {
    if (paidAmount >= 1e16) {
      throw new BadRequestException('Payment amount exceeds maximum permitted precision (16 digits).');
    }
    const schedule = await this.scheduleRepo.findOne({
      where: { id: scheduleId },
      relations: { contract: true }
    });
    if (!schedule) throw new NotFoundException('Installment not found');

    schedule.paidAmount = Number(schedule.paidAmount) + Number(paidAmount);
    schedule.outstandingAmount = Math.max(0, Number(schedule.installmentAmount) - schedule.paidAmount);
    schedule.status = schedule.outstandingAmount === 0 ? 'PAID' : 'PARTIAL';
    schedule.paymentDate = new Date();

    return this.scheduleRepo.save(schedule);
  }

  // --- Discount Workflows ---

  async createDiscountRequest(dto: CreateDiscountRequestDto): Promise<DiscountRequest> {
    const quotation = await this.quotationRepo.findOne({ where: { id: dto.quotationId } });
    if (!quotation) throw new NotFoundException('Quotation not found');

    const request = this.discountRepo.create({
      quotation,
      requestedDiscount: dto.requestedDiscount || 0,
      discountPercentage: dto.discountPercentage || 0,
      reason: dto.reason,
      status: 'PENDING',
    });

    return this.discountRepo.save(request);
  }

  async approveDiscountRequest(id: number, approverId: number, comment: string): Promise<DiscountRequest> {
    const request = await this.discountRepo.findOne({ where: { id }, relations: { quotation: true } });
    if (!request) throw new NotFoundException('Discount request not found');

    request.status = 'APPROVED';
    const saved = await this.discountRepo.save(request);

    // Log approval history
    const history = this.approvalRepo.create({
      request: saved,
      approverId,
      approvalLevel: 1,
      action: 'APPROVED',
      comments: comment,
    });
    await this.approvalRepo.save(history);

    // Apply the approved discount percentage to the quotation as an addition
    if (request.quotation) {
      const q = await this.quotationRepo.findOne({ where: { id: request.quotation.id } });
      if (q) {
        let additionalDiscount = 0;
        if (request.discountPercentage && Number(request.discountPercentage) > 0) {
          additionalDiscount = Number(q.basePrice) * (Number(request.discountPercentage) / 100);
        } else if (request.requestedDiscount && Number(request.requestedDiscount) > 0) {
          additionalDiscount = Number(request.requestedDiscount);
        }
        
        q.discountAmount = Number(q.discountAmount || 0) + additionalDiscount;

        // Recalculate VAT and total amount based on the new net price
        const netPrice = Number(q.basePrice) - q.discountAmount;
        q.vatAmount = netPrice * 0.15; // 15% VAT
        q.totalAmount = netPrice + q.vatAmount;

        await this.quotationRepo.save(q);
      }
    }

    return saved;
  }

  async rejectDiscountRequest(id: number, approverId: number, comment: string): Promise<DiscountRequest> {
    const request = await this.discountRepo.findOne({ where: { id } });
    if (!request) throw new NotFoundException('Discount request not found');

    request.status = 'REJECTED';
    const saved = await this.discountRepo.save(request);

    const history = this.approvalRepo.create({
      request: saved,
      approverId,
      approvalLevel: 1,
      action: 'REJECTED',
      comments: comment,
    });
    await this.approvalRepo.save(history);

    return saved;
  }

  async getDiscountRequests(): Promise<DiscountRequest[]> {
    return this.discountRepo.find({ order: { requestedAt: 'DESC' } });
  }

  // --- Commission Rules & Tracking ---

  async createCommissionRule(dto: CreateCommissionRuleDto): Promise<SalesCommissionRule> {
    const rule = this.commRuleRepo.create({
      commissionName: dto.commissionName,
      commissionType: dto.commissionType,
      commissionValue: dto.commissionValue,
      isActive: true,
    });
    return this.commRuleRepo.save(rule);
  }

  async getCommissionRules(): Promise<SalesCommissionRule[]> {
    return this.commRuleRepo.find({ where: { isActive: true } });
  }

  async calculateCommissions(contractId: number): Promise<void> {
    const contract = await this.contractRepo.findOne({
      where: { id: contractId },
      relations: {
        agreement: {
          booking: {
            unit: true,
          },
        },
      },
    });
    if (!contract) return;

    // Resolve sales agent assigned to the unit's property/lead if possible
    const lead = await this.leadRepo.findOne({
      where: { fullName: contract.customer.fullName },
      relations: { assignedSalesAgent: true },
    });
    if (!lead || !lead.assignedSalesAgent) {
      this.logger.warn(`No assigned Sales Agent found for customer ${contract.customer.fullName}. Commission skipped.`);
      return;
    }

    const rules = await this.commRuleRepo.find({ where: { isActive: true } });
    if (rules.length === 0) return;

    const activeRule = rules[0]; // Apply first active commission rule for simplicity
    const saleAmt = Number(contract.contractAmount || 0);
    let commAmt = 0;

    if (activeRule.commissionType === 'PERCENTAGE') {
      commAmt = saleAmt * (Number(activeRule.commissionValue) / 100);
    } else {
      commAmt = Number(activeRule.commissionValue);
    }

    const commission = this.commissionRepo.create({
      contract,
      salesRep: lead.assignedSalesAgent,
      commissionRule: activeRule,
      saleAmount: saleAmt,
      commissionAmount: commAmt,
      status: 'PENDING',
    });

    await this.commissionRepo.save(commission);
  }

  async getCommissions(): Promise<SalesCommission[]> {
    return this.commissionRepo.find({
      relations: { contract: true },
      order: { createdAt: 'DESC' }
    });
  }

  // --- Dashboard Analytics ---

  async getSalesDashboardStats(): Promise<any> {
    const totalReservations = await this.reservationRepo.count();
    const activeBookings = await this.bookingRepo.count({ where: { status: 'APPROVED' } });
    const totalContracts = await this.contractRepo.count();

    const sumRevenue = await this.contractRepo.createQueryBuilder('contract')
      .select('SUM(contract.contractAmount)', 'total')
      .where('contract.status = :status', { status: 'ACTIVE' })
      .getRawOne();

    const sumPendingInstallments = await this.scheduleRepo.createQueryBuilder('sch')
      .select('SUM(sch.outstandingAmount)', 'total')
      .where('sch.status IN (:...statuses)', { statuses: ['PENDING', 'PARTIAL', 'OVERDUE'] })
      .getRawOne();

    const sumCommissions = await this.commissionRepo.createQueryBuilder('comm')
      .select('SUM(comm.commissionAmount)', 'total')
      .where('comm.status = :status', { status: 'PENDING' })
      .getRawOne();

    return {
      totalReservations,
      activeBookings,
      totalContracts,
      salesRevenue: Number(sumRevenue?.total || 0),
      outstandingInstallments: Number(sumPendingInstallments?.total || 0),
      commissionsDue: Number(sumCommissions?.total || 0),
    };
  }

  // --- Helper Audit logger ---

  private async logAudit(entityName: string, entityId: number, action: string, oldValue: any, newValue: any) {
    const log = this.auditLogRepo.create({
      entityName,
      entityId,
      action,
      oldValue,
      newValue,
      changedBy: 1, // Default user
    });
    await this.auditLogRepo.save(log);
  }
}
