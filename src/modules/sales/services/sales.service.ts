import { Injectable, NotFoundException, BadRequestException, Logger, OnModuleInit, Inject, forwardRef } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, IsNull } from 'typeorm';
import { FinanceService } from '../../finance/services/finance.service';
import { BrokerService } from '../../broker/services/broker.service';
import { NotificationsService } from '../../notifications/services/notifications.service';
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
  EmailQuotationDto,
  ConvertReservationDto,
  CreateBookingDto,
  RejectBookingDto,
  FinanceReviewBookingDto,
  CancelBookingDto,
  CreateAgreementDto,
  CreateContractDto,
  CreateInstallmentPlanDto,
  CreateDiscountRequestDto,
  CreateCommissionRuleDto,
  CreateCommissionDto,
  UpdateAgreementVersionDto,
  UpdateContractStatusDto,
  CreateContractAmendmentDto,
  SendInstallmentReminderDto,
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

    // Run startup sweep immediately
    this.processExpiredReservations()
      .then(() => this.logger.log('Initial reservation expiry sweep completed successfully.'))
      .catch((err) => this.logger.error('Failed to run initial reservation expiry sweep', err));

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

      // 3. Sync contracts to ensure property_id is populated from agreement -> booking -> property
      const contractsWithNullProperty = await this.contractRepo.find({
        where: { property: IsNull() },
        relations: { agreement: { booking: { property: true } } }
      });
      for (const contract of contractsWithNullProperty) {
        if (contract.agreement && contract.agreement.booking && contract.agreement.booking.property) {
          contract.property = contract.agreement.booking.property;
          await this.contractRepo.save(contract);
          this.logger.log(`Retroactively set property ${contract.property.propertyName} on contract ${contract.contractNo}`);
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
     @Inject(forwardRef(() => FinanceService))
    private readonly financeService: FinanceService,
    private readonly brokerService: BrokerService,
    private readonly notificationsService: NotificationsService,
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

  async createReservation(dto: CreateReservationDto, userId = 1, username = 'System'): Promise<SalesReservation> {
    const customer = await this.customerRepo.findOne({ where: { id: dto.customerId }, relations: { lead: { assignedSalesAgent: true } } });
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
        changedBy: userId,
        changedByName: username,
      });
      await this.unitStatusHistoryRepo.save(history);
    }

    await this.logAudit('SalesReservation', savedReservation.id, 'CREATE', null, savedReservation);

    // Send confirmation notification
    try {
      const salesRep = customer.lead?.assignedSalesAgent || null;
      const recipients: any[] = [
        {
          recipientName: customer.fullName,
          emailAddress: customer.primaryEmail || undefined,
          phoneNumber: customer.primaryPhone,
        },
      ];
      if (salesRep) {
        recipients.push({
          recipientName: salesRep.fullName,
          emailAddress: salesRep.email || undefined,
          phoneNumber: salesRep.phone || undefined,
        });
      }
      recipients.push({
        recipientName: 'Sales Manager',
        emailAddress: 'manager@ihsanproperties.com',
      });

      await this.notificationsService.sendNotification({
        categoryCode: 'RESERVATION',
        title: `Reservation Confirmed - #${refNo}`,
        body: `Dear ${customer.fullName},\nYour reservation for Unit ${unit.unitCode} at Property ${property.propertyName} has been successfully confirmed. Reservation Fee: ETB ${Number(dto.reservationFee || 0).toLocaleString()}. Expiry Date: ${new Date(dto.expiryDate).toLocaleDateString()}.`,
        referenceTypeId: 'RESERVATION',
        referenceId: savedReservation.id,
        recipients,
      });
    } catch (e) {
      this.logger.error('Failed to send reservation confirmed notification', e);
    }

    try {
      await this.brokerService.handleSalesEvent('RESERVATION_CREATED', savedReservation);
    } catch (e) {
      this.logger.error('Failed to trigger broker reservation created event', e);
    }

    return savedReservation;
  }

  async extendReservation(dto: ExtendReservationDto): Promise<SalesReservationExtension> {
    const reservation = await this.reservationRepo.findOne({
      where: { id: dto.reservationId },
      relations: { unit: true },
    });
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

  async cancelReservation(id: number, userId = 1, username = 'System'): Promise<SalesReservation> {
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
        changedBy: userId,
        changedByName: username,
      });
      await this.unitStatusHistoryRepo.save(history);
    }

    await this.logAudit('SalesReservation', saved.id, 'CANCEL', oldValue, saved);

    return saved;
  }

  async processExpiredReservations(): Promise<void> {
    const today = new Date();
    const expiredReservations = await this.reservationRepo.find({
      where: [
        { status: 'RESERVED' },
        { status: 'Reserved' },
      ],
      relations: { unit: { unitStatus: true } },
    });

    const availableStatus = await this.unitStatusRepo.findOne({ where: { statusName: 'Available' } });

    for (const res of expiredReservations) {
      if (new Date(res.expiryDate) < today) {
        try {
          res.status = 'EXPIRED';
          await this.reservationRepo.save(res);

          if (res.unit && availableStatus) {
            const unit = await this.unitRepo.findOne({ where: { id: res.unit.id }, relations: { unitStatus: true } });
            if (unit && unit.unitStatus && unit.unitStatus.statusName.toUpperCase() === 'RESERVED') {
              const oldStatus = unit.unitStatus;
              unit.unitStatus = availableStatus;
              unit.reservationExpiry = null;
              await this.unitRepo.save(unit);

              const history = this.unitStatusHistoryRepo.create({
                unit,
                oldStatus,
                newStatus: availableStatus,
                reason: `Reservation expired ref: ${res.reservationNo}`,
                changedBy: 1,
                changedByName: 'System Sweeper',
              });
              await this.unitStatusHistoryRepo.save(history);
            }
          }
        } catch (itemErr) {
          this.logger.error(`Error processing expired reservation ID ${res.id}:`, itemErr);
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

  async sendQuotationEmail(id: number, dto: EmailQuotationDto): Promise<{ success: boolean; message: string }> {
    const quotation = await this.quotationRepo.findOne({
      where: { id },
      relations: { customer: true, property: true, unit: true, items: true },
    });
    if (!quotation) throw new NotFoundException('Quotation not found');

    const recipient = dto.recipientEmail || quotation.customer?.primaryEmail;
    if (!recipient) {
      throw new BadRequestException('No recipient email address specified.');
    }

    const itemsHtml = (quotation.items || []).map(i => `
      <tr>
        <td style="padding: 8px; border-bottom: 1px solid #eee;">${i.description}</td>
        <td style="padding: 8px; border-bottom: 1px solid #eee; text-align: center;">${i.quantity}</td>
        <td style="padding: 8px; border-bottom: 1px solid #eee; text-align: right;">ETB ${Number(i.unitPrice).toLocaleString()}</td>
        <td style="padding: 8px; border-bottom: 1px solid #eee; text-align: right; font-weight: bold;">ETB ${Number(i.amount).toLocaleString()}</td>
      </tr>
    `).join('');

    const emailBody = `
      <div style="font-family: 'Segoe UI', Arial, sans-serif; max-width: 650px; margin: 0 auto; border: 1px solid #e2e8f0; border-radius: 8px; overflow: hidden; background: #ffffff; color: #1e293b;">
        <div style="background: linear-gradient(135deg, #1e3a8a, #3b82f6); padding: 24px; color: #ffffff;">
          <h1 style="margin: 0; font-size: 22px; font-weight: 700;">IHSAN REAL ESTATE</h1>
          <p style="margin: 4px 0 0 0; font-size: 14px; opacity: 0.9;">Official Price Quotation & Valuation Summary</p>
        </div>
        
        <div style="padding: 24px;">
          <p>Dear <strong>${quotation.customer?.fullName || 'Valued Client'}</strong>,</p>
          <p>${dto.message || 'Thank you for your interest in IHSAN Real Estate. Please find below the official quotation breakdown for your selected property unit.'}</p>
          
          <div style="background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 6px; padding: 16px; margin: 20px 0;">
            <table style="width: 100%; border-collapse: collapse; font-size: 14px;">
              <tr>
                <td style="padding: 6px 0; color: #64748b;">Quotation Ref:</td>
                <td style="padding: 6px 0; font-weight: bold; text-align: right;">#${quotation.quotationNo}</td>
              </tr>
              <tr>
                <td style="padding: 6px 0; color: #64748b;">Property / Project:</td>
                <td style="padding: 6px 0; font-weight: bold; text-align: right;">${quotation.property?.propertyName || '-'}</td>
              </tr>
              <tr>
                <td style="padding: 6px 0; color: #64748b;">Unit Code / No:</td>
                <td style="padding: 6px 0; font-weight: bold; text-align: right;">Unit ${quotation.unit?.unitCode || '-'}</td>
              </tr>
              <tr>
                <td style="padding: 6px 0; color: #64748b;">Validity Period:</td>
                <td style="padding: 6px 0; font-weight: bold; text-align: right;">Valid until ${new Date(quotation.validityDate).toLocaleDateString()}</td>
              </tr>
            </table>
          </div>

          <h3 style="font-size: 15px; border-bottom: 2px solid #e2e8f0; padding-bottom: 6px; margin-top: 24px;">Financial Breakdown</h3>
          <table style="width: 100%; border-collapse: collapse; font-size: 13px; margin-bottom: 20px;">
            <thead>
              <tr style="background: #f1f5f9; text-align: left;">
                <th style="padding: 8px;">Description</th>
                <th style="padding: 8px; text-align: center;">Qty</th>
                <th style="padding: 8px; text-align: right;">Unit Price</th>
                <th style="padding: 8px; text-align: right;">Amount</th>
              </tr>
            </thead>
            <tbody>
              ${itemsHtml || `
                <tr>
                  <td style="padding: 8px; border-bottom: 1px solid #eee;">Base Valuation</td>
                  <td style="padding: 8px; border-bottom: 1px solid #eee; text-align: center;">1</td>
                  <td style="padding: 8px; border-bottom: 1px solid #eee; text-align: right;">ETB ${Number(quotation.basePrice).toLocaleString()}</td>
                  <td style="padding: 8px; border-bottom: 1px solid #eee; text-align: right; font-weight: bold;">ETB ${Number(quotation.basePrice).toLocaleString()}</td>
                </tr>
              `}
            </tbody>
          </table>

          <div style="background: #eff6ff; border: 1px solid #bfdbfe; border-radius: 6px; padding: 16px; text-align: right; font-size: 14px;">
            <div style="margin-bottom: 4px; color: #64748b;">Base Price: <strong>ETB ${Number(quotation.basePrice).toLocaleString()}</strong></div>
            <div style="margin-bottom: 4px; color: #ef4444;">Discount Applied: <strong>- ETB ${Number(quotation.discountAmount || 0).toLocaleString()}</strong></div>
            <div style="margin-bottom: 6px; color: #64748b;">VAT (15%): <strong>+ ETB ${Number(quotation.vatAmount || 0).toLocaleString()}</strong></div>
            <div style="font-size: 18px; font-weight: bold; color: #1e3a8a; border-top: 1px solid #bfdbfe; padding-top: 8px;">
              Final Quotation Value: ETB ${Number(quotation.totalAmount).toLocaleString()}
            </div>
          </div>

          <p style="font-size: 12px; color: #94a3b8; margin-top: 24px; text-align: center;">
            This quotation is valid until ${new Date(quotation.validityDate).toLocaleDateString()}. To secure this property unit, please contact your sales agent to process a reservation.
          </p>
        </div>
      </div>
    `;

    try {
      await this.notificationsService.sendNotification({
        categoryCode: 'MARKETING',
        channelCode: (dto.recipientPhone || quotation.customer?.primaryPhone) ? 'EMAIL_TELEGRAM' : 'EMAIL',
        title: dto.subject || `Official Quotation #${quotation.quotationNo} - IHSAN Real Estate`,
        body: emailBody,
        referenceTypeId: 'QUOTATION',
        referenceId: quotation.id,
        recipients: [
          {
            recipientName: quotation.customer?.fullName || 'Client',
            emailAddress: recipient,
            phoneNumber: dto.recipientPhone || quotation.customer?.primaryPhone,
          },
        ],
      });
      await this.notificationsService.processQueue();
    } catch (err) {
      this.logger.error(`Failed to dispatch quotation email for #${quotation.quotationNo}`, err);
    }

    await this.logAudit('SalesQuotation', quotation.id, 'EMAIL_SENT', null, { recipientEmail: recipient, sentAt: new Date() });

    return {
      success: true,
      message: `Quotation #${quotation.quotationNo} successfully dispatched to ${recipient}`,
    };
  }

  // --- Booking Management ---

  async convertReservationToBooking(reservationId: number, dto: ConvertReservationDto, userId = 1, username = 'System'): Promise<SalesBooking> {
    const reservation = await this.reservationRepo.findOne({
      where: { id: reservationId },
      relations: { customer: true, property: true, unit: true },
    });
    if (!reservation) throw new NotFoundException(`Reservation with ID ${reservationId} not found.`);

    if (reservation.status === 'CONVERTED' || reservation.status === 'CONVERTED_TO_BOOKING') {
      throw new BadRequestException('This reservation has already been converted to a booking.');
    }

    const quotation = dto.quotationId ? await this.quotationRepo.findOne({ where: { id: dto.quotationId } }) : null;
    const refNo = 'BKG-' + Date.now().toString().slice(-8);

    const booking = this.bookingRepo.create({
      bookingNo: refNo,
      reservation,
      quotation: quotation || null,
      customer: reservation.customer,
      property: reservation.property,
      unit: reservation.unit,
      bookingDate: new Date(),
      bookingAmount: dto.bookingAmount || reservation.reservationFee || 100000,
      status: 'PENDING_SALES',
      approvalStage: 'PENDING_SALES',
      remarks: dto.remarks || `Converted from Reservation #${reservation.reservationNo}`,
      createdBy: dto.createdById || 1,
    });

    const savedBooking = await this.bookingRepo.save(booking);

    // Update reservation status
    reservation.status = 'CONVERTED';
    await this.reservationRepo.save(reservation);

    // Update unit status to Booked
    const bookedStatus = await this.unitStatusRepo.findOne({ where: { statusName: 'Booked' } }) ||
                         await this.unitStatusRepo.findOne({ where: { statusName: 'Reserved' } });
    if (bookedStatus && reservation.unit) {
      const oldStatus = reservation.unit.unitStatus;
      reservation.unit.unitStatus = bookedStatus;
      await this.unitRepo.save(reservation.unit);

      const history = this.unitStatusHistoryRepo.create({
        unit: reservation.unit,
        oldStatus,
        newStatus: bookedStatus,
        reason: `Reservation converted to Booking ref: ${refNo}`,
        changedBy: userId,
        changedByName: username,
      });
      await this.unitStatusHistoryRepo.save(history);
    }

    await this.logAudit('SalesBooking', savedBooking.id, 'CONVERT_FROM_RESERVATION', null, savedBooking);

    // Notify Sales Manager
    try {
      await this.notificationsService.sendNotification({
        categoryCode: 'BOOKING',
        title: `New Booking Pending Sales Approval - #${refNo}`,
        body: `Booking #${refNo} for Unit ${reservation.unit?.unitCode} has been converted from Reservation #${reservation.reservationNo} and is awaiting Sales Manager approval.`,
        referenceTypeId: 'BOOKING',
        referenceId: savedBooking.id,
        recipients: [{ recipientName: 'Sales Manager', emailAddress: 'salesmgr@ihsanrems.com' }],
      });
    } catch (e) {
      this.logger.error('Failed to notify manager of converted booking', e);
    }

    return savedBooking;
  }

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
      status: 'PENDING_SALES',
      approvalStage: 'PENDING_SALES',
      remarks: dto.remarks,
    });

    const savedBooking = await this.bookingRepo.save(booking);

    // If reservation exists, update its status
    if (reservation) {
      reservation.status = 'CONVERTED';
      await this.reservationRepo.save(reservation);
    }

    return savedBooking;
  }

  // --- Two-Tier Booking Approvals (Sales Manager -> Finance Officer) ---

  async approveBooking(id: number, approverId: number): Promise<SalesBooking> {
    const booking = await this.bookingRepo.findOne({ 
      where: { id }, 
      relations: { unit: true, quotation: true } 
    });
    if (!booking) throw new NotFoundException('Booking not found');

    const oldValue = { ...booking };

    // Stage 1: Sales Manager approves -> advances to PENDING_FINANCE
    booking.status = 'PENDING_FINANCE';
    booking.approvalStage = 'PENDING_FINANCE';
    booking.salesApprovedBy = approverId;
    booking.salesApprovedAt = new Date();
    booking.approvedBy = approverId;
    booking.approvedAt = new Date();

    const saved = await this.bookingRepo.save(booking);

    await this.logAudit('SalesBooking', saved.id, 'SALES_APPROVE', oldValue, saved);

    // Notify Finance Department
    try {
      await this.notificationsService.sendNotification({
        categoryCode: 'FINANCE',
        title: `Booking #${booking.bookingNo} Awaiting Finance Approval`,
        body: `Booking #${booking.bookingNo} has been approved by Sales and is now pending Finance review and payment verification.`,
        referenceTypeId: 'BOOKING',
        referenceId: saved.id,
        recipients: [{ recipientName: 'Finance Officer', emailAddress: 'finance@ihsanrems.com' }],
      });
    } catch (e) {
      this.logger.error('Failed to notify finance of booking approval', e);
    }

    return saved;
  }

  async financeReviewBooking(id: number, dto: FinanceReviewBookingDto, userId = 1, username = 'System'): Promise<SalesBooking> {
    const booking = await this.bookingRepo.findOne({
      where: { id },
      relations: { unit: true, quotation: true, customer: true, property: true },
    });
    if (!booking) throw new NotFoundException('Booking not found');

    const oldValue = { ...booking };

    if (dto.action === 'APPROVE') {
      booking.status = 'APPROVED';
      booking.approvalStage = 'APPROVED';
      booking.financeApprovedBy = dto.financeOfficerId || 1;
      booking.financeApprovedAt = new Date();
      booking.financeComment = dto.comment || 'Down payment & bank slip verified';

      const saved = await this.bookingRepo.save(booking);

      // Transition linked quotation to ACCEPTED
      if (booking.quotation) {
        booking.quotation.status = 'ACCEPTED';
        await this.quotationRepo.save(booking.quotation);
      }

      // Transition unit to Sold
      const soldStatus = await this.unitStatusRepo.findOne({ where: { statusName: 'Sold' } });
      const unit = await this.unitRepo.findOne({ where: { id: booking.unit.id }, relations: { unitStatus: true } });
      if (unit && soldStatus && (!unit.unitStatus || unit.unitStatus.statusName !== 'Sold')) {
        const oldStatus = unit.unitStatus;
        unit.unitStatus = soldStatus;
        unit.reservationExpiry = null;
        unit.soldDate = new Date();
        await this.unitRepo.save(unit);

        const history = this.unitStatusHistoryRepo.create({
          unit,
          oldStatus,
          newStatus: soldStatus,
          reason: `Booking final finance approved ref: ${booking.bookingNo}`,
          changedBy: userId,
          changedByName: username,
        });
        await this.unitStatusHistoryRepo.save(history);
      }

      await this.logAudit('SalesBooking', saved.id, 'FINANCE_APPROVE', oldValue, saved);

      try {
        await this.brokerService.handleSalesEvent('BOOKING_APPROVED', saved);
      } catch (e) {
        this.logger.error('Failed to trigger broker booking approved event', e);
      }

      return saved;
    } else {
      // Finance rejects
      booking.status = 'REJECTED';
      booking.approvalStage = 'REJECTED';
      booking.financeComment = dto.comment || 'Finance verification failed';
      booking.rejectionReason = dto.comment || 'Rejected during Finance Review';

      const saved = await this.bookingRepo.save(booking);

      // Revert unit to Available
      const availableStatus = await this.unitStatusRepo.findOne({ where: { statusName: 'Available' } });
      const unit = await this.unitRepo.findOne({ where: { id: booking.unit.id }, relations: { unitStatus: true } });
      if (unit && availableStatus && (!unit.unitStatus || unit.unitStatus.statusName !== 'Available')) {
        const oldStatus = unit.unitStatus;
        unit.unitStatus = availableStatus;
        unit.soldDate = null;
        await this.unitRepo.save(unit);

        const history = this.unitStatusHistoryRepo.create({
          unit,
          oldStatus,
          newStatus: availableStatus,
          reason: `Booking finance rejected ref: ${booking.bookingNo}. Reason: ${dto.comment || 'Finance rejected'}`,
          changedBy: userId,
          changedByName: username,
        });
        await this.unitStatusHistoryRepo.save(history);
      }

      await this.logAudit('SalesBooking', saved.id, 'FINANCE_REJECT', oldValue, saved);

      return saved;
    }
  }

  async rejectBooking(id: number, dto: RejectBookingDto, userId = 1, username = 'System'): Promise<SalesBooking> {
    if (!dto.rejectionReason || !dto.rejectionReason.trim()) {
      throw new BadRequestException('Rejection reason is mandatory.');
    }

    const booking = await this.bookingRepo.findOne({
      where: { id },
      relations: { unit: true, quotation: true },
    });
    if (!booking) throw new NotFoundException('Booking not found');

    const oldValue = { ...booking };
    booking.status = 'REJECTED';
    booking.approvalStage = 'REJECTED';
    booking.rejectionReason = dto.rejectionReason.trim();

    const saved = await this.bookingRepo.save(booking);

    // Revert unit to Available
    const availableStatus = await this.unitStatusRepo.findOne({ where: { statusName: 'Available' } });
    const unit = await this.unitRepo.findOne({ where: { id: booking.unit.id }, relations: { unitStatus: true } });
    if (unit && availableStatus && (!unit.unitStatus || unit.unitStatus.statusName !== 'Available')) {
      const oldStatus = unit.unitStatus;
      unit.unitStatus = availableStatus;
      unit.soldDate = null;
      await this.unitRepo.save(unit);

      const history = this.unitStatusHistoryRepo.create({
        unit,
        oldStatus,
        newStatus: availableStatus,
        reason: `Booking rejected ref: ${booking.bookingNo}. Reason: ${dto.rejectionReason}`,
        changedBy: userId,
        changedByName: username,
      });
      await this.unitStatusHistoryRepo.save(history);
    }

    await this.logAudit('SalesBooking', saved.id, 'REJECT', oldValue, saved);

    return saved;
  }

  async cancelBooking(id: number, dto?: CancelBookingDto, userId = 1, username = 'System'): Promise<SalesBooking> {
    const booking = await this.bookingRepo.findOne({ where: { id }, relations: { unit: true } });
    if (!booking) throw new NotFoundException('Booking not found');

    const oldValue = { ...booking };
    booking.status = 'CANCELLED';
    booking.approvalStage = 'CANCELLED';
    if (dto?.cancellationReason) {
      booking.cancellationReason = dto.cancellationReason.trim();
    }
    const saved = await this.bookingRepo.save(booking);

    // Return unit to Available
    const availableStatus = await this.unitStatusRepo.findOne({ where: { statusName: 'Available' } });
    const unit = await this.unitRepo.findOne({ where: { id: booking.unit.id }, relations: { unitStatus: true } });
    if (unit && availableStatus && (!unit.unitStatus || unit.unitStatus.statusName !== 'Available')) {
      const oldStatus = unit.unitStatus;
      unit.unitStatus = availableStatus;
      unit.soldDate = null;
      await this.unitRepo.save(unit);

      const history = this.unitStatusHistoryRepo.create({
        unit,
        oldStatus,
        newStatus: availableStatus,
        reason: `Booking cancelled ref: ${booking.bookingNo}. Reason: ${booking.cancellationReason || 'Client cancellation'}`,
        changedBy: userId,
        changedByName: username,
      });
      await this.unitStatusHistoryRepo.save(history);
    }

    await this.logAudit('SalesBooking', saved.id, 'CANCEL', oldValue, saved);

    return saved;
  }

  async findAllBookings(): Promise<SalesBooking[]> {
    return this.bookingRepo.find({
      relations: { reservation: true, quotation: true },
      order: { bookingDate: 'DESC' },
    });
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
      property: agreement.booking?.property,
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

    try {
      const contractWithBooking = await this.contractRepo.findOne({
        where: { id: savedContract.id },
        relations: { agreement: { booking: { property: true, reservation: true } }, customer: { lead: true } }
      });
      if (contractWithBooking) {
        await this.brokerService.handleSalesEvent('CONTRACT_CREATED', contractWithBooking);
      }
    } catch (e) {
      this.logger.error('Failed to trigger broker contract created event', e);
    }

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

  async updateAgreementVersion(id: number, dto: UpdateAgreementVersionDto): Promise<SalesAgreement> {
    const agreement = await this.agreementRepo.findOne({
      where: { id },
      relations: { booking: { property: true, unit: true }, customer: true }
    });
    if (!agreement) throw new NotFoundException('Agreement not found');

    const oldValue = { ...agreement };
    agreement.agreementVersion = (agreement.agreementVersion || 1) + 1;
    if (dto.agreementDocument) {
      agreement.agreementDocument = dto.agreementDocument;
    }

    const saved = await this.agreementRepo.save(agreement);
    await this.logAudit('SalesAgreement', saved.id, 'VERSION_INCREMENT', oldValue, {
      version: saved.agreementVersion,
      remarks: dto.changeRemarks || `Version incremented to v${saved.agreementVersion}.0`,
      modifiedAt: new Date(),
    });

    return saved;
  }

  async getAgreementHistory(id: number): Promise<any[]> {
    return this.auditLogRepo.find({
      where: { entityName: 'SalesAgreement', entityId: id },
      order: { changedAt: 'DESC' },
    });
  }

  async updateContractStatus(id: number, dto: UpdateContractStatusDto): Promise<SalesContract> {
    const contract = await this.contractRepo.findOne({
      where: { id },
      relations: { agreement: { booking: { unit: true } }, customer: true, property: true }
    });
    if (!contract) throw new NotFoundException('Contract not found');

    const validStatuses = ['DRAFT', 'UNDER_REVIEW', 'PENDING_SIGNATURE', 'SIGNED', 'ACTIVE', 'COMPLETED', 'TERMINATED', 'CANCELLED'];
    if (!validStatuses.includes(dto.status.toUpperCase())) {
      throw new BadRequestException(`Invalid contract status. Allowed statuses: ${validStatuses.join(', ')}`);
    }

    const oldValue = { ...contract };
    contract.status = dto.status.toUpperCase();
    if (dto.remarks) {
      contract.remarks = dto.remarks;
    }

    const saved = await this.contractRepo.save(contract);
    await this.logAudit('SalesContract', saved.id, 'STATUS_CHANGE', oldValue, {
      newStatus: saved.status,
      remarks: dto.remarks || `Contract status updated to ${saved.status}`,
    });

    return saved;
  }

  async createContractAmendment(id: number, dto: CreateContractAmendmentDto): Promise<any> {
    const contract = await this.contractRepo.findOne({
      where: { id },
      relations: { customer: true, property: true }
    });
    if (!contract) throw new NotFoundException('Contract not found');

    const amendmentPayload = {
      amendmentNo: 'AMD-' + Date.now().toString().slice(-6),
      amendmentType: dto.amendmentType,
      amendmentDescription: dto.amendmentDescription,
      adjustedAmount: dto.adjustedAmount,
      effectiveDate: dto.effectiveDate || new Date(),
      remarks: dto.remarks || 'Contract amendment approved',
      createdAt: new Date(),
    };

    if (dto.adjustedAmount && dto.adjustedAmount > 0) {
      contract.contractAmount = dto.adjustedAmount;
      await this.contractRepo.save(contract);
    }

    await this.logAudit('SalesContract', contract.id, 'CONTRACT_AMENDMENT', null, amendmentPayload);

    return {
      success: true,
      message: `Amendment #${amendmentPayload.amendmentNo} registered successfully`,
      amendment: amendmentPayload,
      contract,
    };
  }

  async getContractAmendments(id: number): Promise<any[]> {
    const logs = await this.auditLogRepo.find({
      where: { entityName: 'SalesContract', entityId: id, action: 'CONTRACT_AMENDMENT' },
      order: { changedAt: 'DESC' },
    });
    return logs.map(log => log.newValue);
  }

  async sendInstallmentReminder(id: number, dto: SendInstallmentReminderDto): Promise<any> {
    const installment = await this.scheduleRepo.findOne({
      where: { id },
      relations: { contract: { customer: true, property: true, agreement: { booking: { unit: true } } } },
    });
    if (!installment) throw new NotFoundException('Installment schedule not found');

    const customer = installment.contract?.customer;
    const property = installment.contract?.property;
    const unit = installment.contract?.agreement?.booking?.unit;

    const emailBody = `
      <div style="font-family: Arial, sans-serif; color: #1e293b; max-width: 600px; margin: auto; border: 1px solid #e2e8f0; border-radius: 8px; overflow: hidden;">
        <div style="background-color: #0f172a; padding: 24px; text-align: center; color: white;">
          <h2 style="margin: 0; color: #38bdf8; font-size: 20px;">IHSAN REAL ESTATE</h2>
          <p style="margin: 4px 0 0 0; font-size: 13px; color: #94a3b8;">Official Payment Reminder Notice</p>
        </div>
        <div style="padding: 24px; background: #ffffff;">
          <p>Dear <strong>${customer?.fullName || 'Valued Client'}</strong>,</p>
          <p>This is a payment reminder for your scheduled installment on <strong>Contract #${installment.contract?.contractNo}</strong>.</p>
          
          <table style="width: 100%; border-collapse: collapse; margin: 16px 0; font-size: 14px;">
            <tr style="border-bottom: 1px solid #e2e8f0;">
              <td style="padding: 8px; color: #64748b;">Installment Sequence</td>
              <td style="padding: 8px; font-weight: bold; text-align: right;">Installment #${installment.installmentNo}</td>
            </tr>
            <tr style="border-bottom: 1px solid #e2e8f0;">
              <td style="padding: 8px; color: #64748b;">Property / Unit</td>
              <td style="padding: 8px; font-weight: bold; text-align: right;">${property?.propertyName || ''} - Unit ${unit?.unitNumber || unit?.unitCode || 'Unit'}</td>
            </tr>
            <tr style="border-bottom: 1px solid #e2e8f0;">
              <td style="padding: 8px; color: #64748b;">Due Date</td>
              <td style="padding: 8px; font-weight: bold; color: #dc2626; text-align: right;">${new Date(installment.dueDate).toLocaleDateString()}</td>
            </tr>
            <tr style="border-bottom: 1px solid #e2e8f0; background-color: #f8fafc;">
              <td style="padding: 10px; font-weight: bold;">Amount Due</td>
              <td style="padding: 10px; font-weight: bold; color: #0284c7; text-align: right; font-size: 16px;">ETB ${Number(installment.installmentAmount).toLocaleString()}</td>
            </tr>
          </table>

          ${dto.customNote ? `<div style="background-color: #f1f5f9; padding: 12px; border-radius: 6px; font-size: 13px; margin: 16px 0;"><strong>Note:</strong> ${dto.customNote}</div>` : ''}

          <p style="font-size: 12px; color: #64748b;">Please proceed with your deposit into our designated bank account and share your deposit receipt with your assigned account manager.</p>
        </div>
      </div>
    `;

    const channel = dto.channelCode || (customer?.primaryPhone ? 'EMAIL_TELEGRAM' : 'EMAIL');

    try {
      await this.notificationsService.sendNotification({
        categoryCode: 'MARKETING',
        channelCode: channel,
        title: `Payment Reminder: Installment #${installment.installmentNo} for Contract #${installment.contract?.contractNo}`,
        body: emailBody,
        referenceTypeId: 'INSTALLMENT',
        referenceId: installment.id,
        recipients: [
          {
            recipientName: customer?.fullName || 'Client',
            emailAddress: customer?.primaryEmail,
            phoneNumber: customer?.primaryPhone,
          },
        ],
      });
      await this.notificationsService.processQueue();
    } catch (err) {
      this.logger.error(`Failed to dispatch installment reminder for #${installment.id}`, err);
    }

    await this.logAudit('InstallmentSchedule', installment.id, 'REMINDER_SENT', null, {
      installmentNo: installment.installmentNo,
      dueDate: installment.dueDate,
      channel,
      sentAt: new Date(),
    });

    return {
      success: true,
      message: `Installment reminder notice dispatched successfully to ${customer?.fullName || 'Customer'}.`,
    };
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
    const quotation = await this.quotationRepo.findOne({ where: { id: dto.quotationId }, relations: { customer: true } });
    if (!quotation) throw new NotFoundException('Quotation not found');

    const request = this.discountRepo.create({
      quotation,
      requestedDiscount: dto.requestedDiscount || 0,
      discountPercentage: dto.discountPercentage || 0,
      reason: dto.reason,
      status: 'PENDING',
      requestedBy: 1,
    });

    const saved = await this.discountRepo.save(request);

    await this.logAudit('DiscountRequest', saved.id, 'DISCOUNT_REQUESTED', null, {
      quotationNo: quotation.quotationNo,
      customerName: quotation.customer?.fullName,
      requestedDiscount: saved.requestedDiscount,
      discountPercentage: saved.discountPercentage,
      reason: saved.reason,
      requestedBy: saved.requestedBy,
      requestedAt: new Date(),
    });

    return saved;
  }

  async approveDiscountRequest(id: number, approverId: number, comment?: string): Promise<DiscountRequest> {
    const request = await this.discountRepo.findOne({ where: { id }, relations: { quotation: true } });
    if (!request) throw new NotFoundException('Discount request not found');

    request.status = 'APPROVED';
    const saved = await this.discountRepo.save(request);

    // Log approval history
    const history = this.approvalRepo.create({
      request: saved,
      approverId: approverId || 1,
      approvalLevel: 1,
      action: 'APPROVED',
      comments: comment || 'Discount approved by management',
    });
    await this.approvalRepo.save(history);

    await this.logAudit('DiscountRequest', saved.id, 'DISCOUNT_APPROVED', { status: 'PENDING' }, {
      status: 'APPROVED',
      approverId: approverId || 1,
      comment: comment || 'Discount approved',
      actionDate: new Date(),
    });

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

  async rejectDiscountRequest(id: number, approverId: number, comment?: string): Promise<DiscountRequest> {
    const request = await this.discountRepo.findOne({ where: { id } });
    if (!request) throw new NotFoundException('Discount request not found');

    request.status = 'REJECTED';
    const saved = await this.discountRepo.save(request);

    const history = this.approvalRepo.create({
      request: saved,
      approverId: approverId || 1,
      approvalLevel: 1,
      action: 'REJECTED',
      comments: comment || 'Discount request rejected',
    });
    await this.approvalRepo.save(history);

    await this.logAudit('DiscountRequest', saved.id, 'DISCOUNT_REJECTED', { status: 'PENDING' }, {
      status: 'REJECTED',
      approverId: approverId || 1,
      comment: comment || 'Discount rejected',
      actionDate: new Date(),
    });

    return saved;
  }

  async getDiscountRequests(): Promise<DiscountRequest[]> {
    return this.discountRepo.find({
      relations: { quotation: { customer: true, property: true } },
      order: { requestedAt: 'DESC' }
    });
  }

  async getDiscountHistory(requestId: number): Promise<any> {
    const request = await this.discountRepo.findOne({
      where: { id: requestId },
      relations: { quotation: { customer: true } }
    });
    if (!request) throw new NotFoundException('Discount request not found');

    const approvals = await this.approvalRepo.find({
      where: { request: { id: requestId } },
      order: { actionDate: 'DESC' }
    });

    const auditLogs = await this.auditLogRepo.find({
      where: { entityName: 'DiscountRequest', entityId: requestId },
      order: { changedAt: 'DESC' }
    });

    return {
      request,
      approvals,
      auditLogs,
    };
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

  async calculateCommissions(contractId: number): Promise<SalesCommission | null> {
    const contract = await this.contractRepo.findOne({
      where: { id: contractId },
      relations: {
        customer: true,
        agreement: {
          booking: {
            unit: true,
          },
        },
      },
    });
    if (!contract) return null;

    // Resolve sales agent assigned to the unit's property/lead, or fallback to first available agent
    let agent: SalesAgent | null = null;
    if (contract.customer) {
      const lead = await this.leadRepo.findOne({
        where: { fullName: contract.customer.fullName },
        relations: { assignedSalesAgent: true },
      });
      if (lead && lead.assignedSalesAgent) {
        agent = lead.assignedSalesAgent;
      }
    }

    if (!agent) {
      agent = await this.agentRepo.findOne({ where: { isActive: true } });
      if (!agent) {
        agent = await this.agentRepo.findOne({ where: {} });
      }
    }

    if (!agent) {
      this.logger.warn(`No Sales Agent found in database. Commission skipped.`);
      return null;
    }

    // Check if a commission record already exists for this contract
    const existing = await this.commissionRepo.findOne({
      where: { contract: { id: contractId } }
    });
    if (existing) {
      this.logger.warn(`Commission already generated for contract ${contract.contractNo}.`);
      return existing;
    }

    // Fetch active commission rule, or auto-create standard 2% rule
    let activeRule = await this.commRuleRepo.findOne({ where: { isActive: true } });
    if (!activeRule) {
      activeRule = this.commRuleRepo.create({
        commissionName: 'Standard Sales Agent 2% Rule',
        commissionType: 'PERCENTAGE',
        commissionValue: 2.0,
        isActive: true,
      });
      activeRule = await this.commRuleRepo.save(activeRule);
    }

    const saleAmt = Number(contract.contractAmount || 0);
    let commAmt = 0;

    if (activeRule.commissionType === 'PERCENTAGE') {
      commAmt = saleAmt * (Number(activeRule.commissionValue) / 100);
    } else {
      commAmt = Number(activeRule.commissionValue);
    }

    const commission = this.commissionRepo.create({
      contract,
      salesRep: agent,
      commissionRule: activeRule,
      saleAmount: saleAmt,
      commissionAmount: commAmt,
      status: 'PENDING',
    });

    const saved = await this.commissionRepo.save(commission);
    this.logger.log(`Successfully generated PENDING commission for contract ${contract.contractNo} (Agent: ${agent.fullName}, Amount: ETB ${commAmt})`);

    await this.logAudit('SalesCommission', saved.id, 'COMMISSION_CALCULATED', null, {
      contractNo: contract.contractNo,
      agentName: agent.fullName,
      saleAmount: saleAmt,
      commissionAmount: commAmt,
      status: 'PENDING',
      calculatedAt: new Date(),
    });

    return saved;
  }

  async getCommissions(): Promise<SalesCommission[]> {
    return this.commissionRepo.find({
      relations: { contract: { customer: true }, salesRep: true, commissionRule: true },
      order: { createdAt: 'DESC' }
    });
  }

  async reviewCommission(id: number, action: 'APPROVE' | 'REJECT', remarks?: string, reviewerId?: number): Promise<SalesCommission> {
    const commission = await this.commissionRepo.findOne({
      where: { id },
      relations: { contract: true, salesRep: true }
    });
    if (!commission) throw new NotFoundException('Sales commission record not found');

    const previousStatus = commission.status;
    commission.status = action === 'APPROVE' ? 'APPROVED' : 'REJECTED';
    const saved = await this.commissionRepo.save(commission);

    await this.logAudit('SalesCommission', commission.id, `COMMISSION_${commission.status}`, { status: previousStatus }, {
      status: commission.status,
      remarks: remarks || `Commission ${commission.status.toLowerCase()} by finance officer`,
      reviewerId: reviewerId || 1,
      reviewedAt: new Date(),
    });

    return saved;
  }

  async getCommissionsReport(filters: { agentId?: number; startDate?: string; endDate?: string; status?: string }): Promise<any> {
    const qb = this.commissionRepo.createQueryBuilder('c')
      .leftJoinAndSelect('c.contract', 'contract')
      .leftJoinAndSelect('contract.customer', 'customer')
      .leftJoinAndSelect('c.salesRep', 'salesRep')
      .leftJoinAndSelect('c.commissionRule', 'commissionRule');

    if (filters.agentId) {
      qb.andWhere('salesRep.id = :agentId', { agentId: filters.agentId });
    }
    if (filters.status && filters.status !== 'ALL') {
      qb.andWhere('c.status = :status', { status: filters.status });
    }
    if (filters.startDate) {
      qb.andWhere('c.createdAt >= :startDate', { startDate: new Date(filters.startDate) });
    }
    if (filters.endDate) {
      qb.andWhere('c.createdAt <= :endDate', { endDate: new Date(filters.endDate) });
    }

    const items = await qb.orderBy('c.createdAt', 'DESC').getMany();

    const totalCommission = items.reduce((sum, item) => sum + Number(item.commissionAmount || 0), 0);
    const approvedCommission = items.filter(i => i.status === 'APPROVED').reduce((sum, item) => sum + Number(item.commissionAmount || 0), 0);
    const pendingCommission = items.filter(i => i.status === 'PENDING' || i.status === 'PENDING_APPROVAL' || i.status === 'CALCULATED').reduce((sum, item) => sum + Number(item.commissionAmount || 0), 0);
    const paidCommission = items.filter(i => i.status === 'PAID').reduce((sum, item) => sum + Number(item.commissionAmount || 0), 0);

    return {
      kpis: {
        totalCommission,
        approvedCommission,
        pendingCommission,
        paidCommission,
        totalCount: items.length,
      },
      commissions: items,
    };
  }

  async updateCommissionStatus(id: number, status: string): Promise<SalesCommission> {
    const commission = await this.commissionRepo.findOne({
      where: { id },
      relations: { contract: true }
    });
    if (!commission) throw new NotFoundException('Sales commission not found');

    const validStatuses = ['CALCULATED', 'PENDING', 'PENDING_APPROVAL', 'APPROVED', 'PAID', 'REVERSED', 'REJECTED'];
    if (!validStatuses.includes(status)) {
      throw new BadRequestException(`Invalid status: ${status}. Must be one of ${validStatuses.join(', ')}`);
    }

    commission.status = status;
    return this.commissionRepo.save(commission);
  }

  async terminateContract(contractId: number): Promise<SalesContract> {
    const contract = await this.contractRepo.findOne({
      where: { id: contractId },
      relations: { agreement: { booking: { unit: { unitStatus: true } } } }
    });
    if (!contract) throw new NotFoundException('Sales contract not found');

    // 1. Update contract status to TERMINATED
    contract.status = 'TERMINATED';
    const savedContract = await this.contractRepo.save(contract);

    // 2. Release unit status back to AVAILABLE
    if (contract.agreement?.booking?.unit) {
      const unit = contract.agreement.booking.unit;
      const availableStatus = await this.unitStatusRepo.findOne({ where: { statusName: 'AVAILABLE' } });
      if (availableStatus) {
        const oldStatus = unit.unitStatus;
        unit.unitStatus = availableStatus;
        unit.soldDate = null;
        await this.unitRepo.save(unit);

        // Log unit status history
        const history = this.unitStatusHistoryRepo.create({
          unit,
          oldStatus,
          newStatus: availableStatus,
          reason: `Contract ${contract.contractNo} terminated. Unit released.`,
        });
        await this.unitStatusHistoryRepo.save(history);
      }
    }

    // 3. Automatically reverse all approved/paid/calculated commissions linked to this contract
    const commissions = await this.commissionRepo.find({
      where: { contract: { id: contractId } }
    });
    for (const comm of commissions) {
      comm.status = 'REVERSED';
      await this.commissionRepo.save(comm);
    }

    this.logger.log(`Contract ${contract.contractNo} terminated. Associated commissions reversed.`);
    return savedContract;
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
