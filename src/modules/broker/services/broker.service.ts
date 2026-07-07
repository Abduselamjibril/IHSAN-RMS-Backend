import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Not } from 'typeorm';

// Entities
import { Broker } from '../entities/broker.entity';
import { BrokerBankAccount } from '../entities/broker-bank-account.entity';
import { BrokerDocument } from '../entities/broker-document.entity';
import { BrokerProjectAssignment } from '../entities/broker-project-assignment.entity';
import { LeadBrokerAssignment } from '../entities/lead-broker-assignment.entity';
import { CommissionPlan } from '../entities/commission-plan.entity';
import { CommissionPlanDetail } from '../entities/commission-plan-detail.entity';
import { ProjectCommissionPlan } from '../entities/project-commission-plan.entity';
import { BrokerSale } from '../entities/broker-sale.entity';
import { BrokerCommission } from '../entities/broker-commission.entity';
import { BrokerCommissionAdjustment } from '../entities/broker-commission-adjustment.entity';
import { CommissionPayment } from '../entities/commission-payment.entity';
import { CommissionPaymentDetail } from '../entities/commission-payment-detail.entity';
import { BrokerPerformanceSnapshot } from '../entities/broker-performance-snapshot.entity';
import { BrokerTarget } from '../entities/broker-target.entity';

// Referenced Entities
import { Lead } from '../../crm/entities/lead.entity';
import { LeadSource } from '../../crm/entities/lead-source.entity';
import { Property } from '../../properties/entities/property.entity';
import { Customer } from '../../crm/entities/customer.entity';
import { SalesReservation } from '../../sales/entities/sales-reservation.entity';
import { SalesContract } from '../../sales/entities/sales-contract.entity';

// DTOs
import {
  CreateBrokerDto,
  UpdateBrokerDto,
  CreateBrokerBankAccountDto,
  AssignProjectDto,
  AssignLeadDto,
  CreateCommissionPlanDto,
  AssignProjectCommissionPlanDto,
  CreateBrokerSaleDto,
  CreateAdjustmentDto,
  RecordPaymentDto,
  SetTargetDto,
} from '../dto/broker.dto';

@Injectable()
export class BrokerService {
  constructor(
    @InjectRepository(Broker) private readonly brokerRepo: Repository<Broker>,
    @InjectRepository(BrokerBankAccount) private readonly bankRepo: Repository<BrokerBankAccount>,
    @InjectRepository(BrokerDocument) private readonly docRepo: Repository<BrokerDocument>,
    @InjectRepository(BrokerProjectAssignment) private readonly projectAssignRepo: Repository<BrokerProjectAssignment>,
    @InjectRepository(LeadBrokerAssignment) private readonly leadAssignRepo: Repository<LeadBrokerAssignment>,
    @InjectRepository(CommissionPlan) private readonly planRepo: Repository<CommissionPlan>,
    @InjectRepository(CommissionPlanDetail) private readonly detailRepo: Repository<CommissionPlanDetail>,
    @InjectRepository(ProjectCommissionPlan) private readonly projPlanRepo: Repository<ProjectCommissionPlan>,
    @InjectRepository(BrokerSale) private readonly saleRepo: Repository<BrokerSale>,
    @InjectRepository(BrokerCommission) private readonly commissionRepo: Repository<BrokerCommission>,
    @InjectRepository(BrokerCommissionAdjustment) private readonly adjustmentRepo: Repository<BrokerCommissionAdjustment>,
    @InjectRepository(CommissionPayment) private readonly paymentRepo: Repository<CommissionPayment>,
    @InjectRepository(CommissionPaymentDetail) private readonly payDetailRepo: Repository<CommissionPaymentDetail>,
    @InjectRepository(BrokerPerformanceSnapshot) private readonly snapshotRepo: Repository<BrokerPerformanceSnapshot>,
    @InjectRepository(BrokerTarget) private readonly targetRepo: Repository<BrokerTarget>,

    // Referenced repos
    @InjectRepository(Lead) private readonly leadRepo: Repository<Lead>,
    @InjectRepository(Property) private readonly propertyRepo: Repository<Property>,
    @InjectRepository(Customer) private readonly customerRepo: Repository<Customer>,
    @InjectRepository(SalesReservation) private readonly reservationRepo: Repository<SalesReservation>,
    @InjectRepository(SalesContract) private readonly contractRepo: Repository<SalesContract>,
  ) {}

  // =========================================================================
  // BROKER MASTER SECTION
  // =========================================================================
  async createBroker(dto: CreateBrokerDto, user: string = 'SYSTEM'): Promise<Broker> {
    // Duplicate checks
    const dupPhone = await this.brokerRepo.findOne({ where: { phoneNumber: dto.phoneNumber } });
    if (dupPhone) {
      throw new BadRequestException(`Broker with phone number ${dto.phoneNumber} already exists`);
    }

    if (dto.tradeLicenseNumber) {
      const dupLicense = await this.brokerRepo.findOne({ where: { tradeLicenseNumber: dto.tradeLicenseNumber } });
      if (dupLicense) {
        throw new BadRequestException(`Broker with trade license number ${dto.tradeLicenseNumber} already exists`);
      }
    }

    if (dto.emailAddress) {
      const dupEmail = await this.brokerRepo.findOne({ where: { emailAddress: dto.emailAddress } });
      if (dupEmail) {
        throw new BadRequestException(`Broker with email address ${dto.emailAddress} already exists`);
      }
    }

    const broker = new Broker();
    const count = await this.brokerRepo.count();
    broker.brokerCode = `BRK-${String(count + 1).padStart(4, '0')}`;
    broker.brokerTypeId = dto.brokerTypeId;
    broker.brokerName = dto.brokerName;
    broker.tradeLicenseNumber = dto.tradeLicenseNumber || null;
    broker.tinNumber = dto.tinNumber || null;
    broker.phoneNumber = dto.phoneNumber;
    broker.alternatePhoneNumber = dto.alternatePhoneNumber || null;
    broker.emailAddress = dto.emailAddress || null;
    broker.address = dto.address || null;
    broker.city = dto.city || null;
    broker.remarks = dto.remarks || null;
    broker.statusId = 'ACTIVE';
    broker.createdBy = user;

    return this.brokerRepo.save(broker);
  }

  async getBrokers(): Promise<Broker[]> {
    return this.brokerRepo.find({ order: { brokerName: 'ASC' } });
  }

  async getBrokerById(id: number): Promise<any> {
    const broker = await this.brokerRepo.findOne({ where: { id } });
    if (!broker) {
      throw new NotFoundException(`Broker with ID ${id} not found`);
    }
    const bankAccounts = await this.bankRepo.find({ where: { broker: { id } } });
    const documents = await this.docRepo.find({ where: { broker: { id } } });
    const projectAssignments = await this.projectAssignRepo.find({
      where: { broker: { id } },
      relations: { property: true },
    });
    const leadAssignments = await this.leadAssignRepo.find({
      where: { broker: { id } },
      relations: { lead: true },
    });

    return {
      ...broker,
      bankAccounts,
      documents,
      projectAssignments,
      leadAssignments,
    };
  }

  async updateBroker(id: number, dto: UpdateBrokerDto, user: string = 'SYSTEM'): Promise<Broker> {
    const broker = await this.brokerRepo.findOne({ where: { id } });
    if (!broker) {
      throw new NotFoundException(`Broker with ID ${id} not found`);
    }

    if (dto.phoneNumber !== undefined && dto.phoneNumber !== broker.phoneNumber) {
      const dupPhone = await this.brokerRepo.findOne({ where: { phoneNumber: dto.phoneNumber, id: Not(id) } });
      if (dupPhone) {
        throw new BadRequestException(`Broker with phone number ${dto.phoneNumber} already exists`);
      }
    }

    if (dto.tradeLicenseNumber !== undefined && dto.tradeLicenseNumber !== broker.tradeLicenseNumber) {
      if (dto.tradeLicenseNumber) {
        const dupLicense = await this.brokerRepo.findOne({ where: { tradeLicenseNumber: dto.tradeLicenseNumber, id: Not(id) } });
        if (dupLicense) {
          throw new BadRequestException(`Broker with trade license number ${dto.tradeLicenseNumber} already exists`);
        }
      }
    }

    if (dto.emailAddress !== undefined && dto.emailAddress !== broker.emailAddress) {
      if (dto.emailAddress) {
        const dupEmail = await this.brokerRepo.findOne({ where: { emailAddress: dto.emailAddress, id: Not(id) } });
        if (dupEmail) {
          throw new BadRequestException(`Broker with email address ${dto.emailAddress} already exists`);
        }
      }
    }

    if (dto.brokerTypeId !== undefined) broker.brokerTypeId = dto.brokerTypeId;
    if (dto.brokerName !== undefined) broker.brokerName = dto.brokerName;
    if (dto.tradeLicenseNumber !== undefined) broker.tradeLicenseNumber = dto.tradeLicenseNumber || null;
    if (dto.tinNumber !== undefined) broker.tinNumber = dto.tinNumber || null;
    if (dto.phoneNumber !== undefined) broker.phoneNumber = dto.phoneNumber;
    if (dto.alternatePhoneNumber !== undefined) broker.alternatePhoneNumber = dto.alternatePhoneNumber || null;
    if (dto.emailAddress !== undefined) broker.emailAddress = dto.emailAddress || null;
    if (dto.address !== undefined) broker.address = dto.address || null;
    if (dto.city !== undefined) broker.city = dto.city || null;
    if (dto.statusId !== undefined) broker.statusId = dto.statusId;
    if (dto.remarks !== undefined) broker.remarks = dto.remarks || null;
    broker.updatedBy = user;

    return this.brokerRepo.save(broker);
  }

  async deleteBroker(id: number, user: string = 'SYSTEM'): Promise<Broker> {
    return this.updateBroker(id, { statusId: 'INACTIVE' }, user);
  }

  // =========================================================================
  // BANK ACCOUNT SECTION
  // =========================================================================
  async addBankAccount(brokerId: number, dto: CreateBrokerBankAccountDto, user: string = 'SYSTEM'): Promise<BrokerBankAccount> {
    const broker = await this.brokerRepo.findOne({ where: { id: brokerId } });
    if (!broker) {
      throw new NotFoundException(`Broker with ID ${brokerId} not found`);
    }

    if (dto.isDefault) {
      // Clear other defaults
      await this.bankRepo.update({ broker: { id: brokerId } }, { isDefault: false });
    }

    const bank = new BrokerBankAccount();
    bank.broker = broker;
    bank.bankName = dto.bankName;
    bank.accountName = dto.accountName;
    bank.accountNumber = dto.accountNumber;
    bank.isDefault = dto.isDefault || false;
    bank.createdBy = user;

    return this.bankRepo.save(bank);
  }

  async deleteBankAccount(brokerId: number, accountId: number): Promise<void> {
    const acc = await this.bankRepo.findOne({ where: { id: accountId, broker: { id: brokerId } } });
    if (!acc) {
      throw new NotFoundException(`Bank Account ID ${accountId} not found for Broker ${brokerId}`);
    }
    await this.bankRepo.remove(acc);
  }

  // =========================================================================
  // DOCUMENT UPLOAD SECTION
  // =========================================================================
  async addDocument(
    brokerId: number,
    file: any,
    body: { documentTypeId: string; documentName: string; expiryDate?: string },
    user: string = 'SYSTEM',
  ): Promise<BrokerDocument> {
    const broker = await this.brokerRepo.findOne({ where: { id: brokerId } });
    if (!broker) {
      throw new NotFoundException(`Broker with ID ${brokerId} not found`);
    }

    const doc = new BrokerDocument();
    doc.broker = broker;
    doc.documentTypeId = body.documentTypeId;
    doc.documentName = body.documentName;
    doc.fileName = file.originalname || file.filename;
    doc.filePath = `/uploads/${file.filename}`;
    if (body.expiryDate) {
      doc.expiryDate = new Date(body.expiryDate);
    }
    doc.createdBy = user;

    return this.docRepo.save(doc);
  }

  async deleteDocument(brokerId: number, docId: number): Promise<void> {
    const doc = await this.docRepo.findOne({ where: { id: docId, broker: { id: brokerId } } });
    if (!doc) {
      throw new NotFoundException(`Document ID ${docId} not found for Broker ${brokerId}`);
    }
    await this.docRepo.remove(doc);
  }

  // =========================================================================
  // PROJECT & LEAD ASSIGNMENTS SECTION
  // =========================================================================
  async assignProject(brokerId: number, dto: AssignProjectDto, user: string = 'SYSTEM'): Promise<BrokerProjectAssignment> {
    const broker = await this.brokerRepo.findOne({ where: { id: brokerId } });
    if (!broker) throw new NotFoundException(`Broker ID ${brokerId} not found`);

    const property = await this.propertyRepo.findOne({ where: { id: dto.propertyId } });
    if (!property) throw new NotFoundException(`Property ID ${dto.propertyId} not found`);

    const assign = new BrokerProjectAssignment();
    assign.broker = broker;
    assign.property = property;
    assign.startDate = new Date(dto.startDate);
    if (dto.endDate) assign.endDate = new Date(dto.endDate);
    assign.statusId = dto.statusId || 'ACTIVE';
    assign.createdBy = user;

    return this.projectAssignRepo.save(assign);
  }

  async removeProjectAssignment(brokerId: number, assignmentId: number): Promise<void> {
    const assign = await this.projectAssignRepo.findOne({ where: { id: assignmentId, broker: { id: brokerId } } });
    if (!assign) throw new NotFoundException(`Assignment ${assignmentId} not found`);
    await this.projectAssignRepo.remove(assign);
  }

  async assignLead(brokerId: number, dto: AssignLeadDto, user: string = 'SYSTEM'): Promise<LeadBrokerAssignment> {
    const broker = await this.brokerRepo.findOne({ where: { id: brokerId } });
    if (!broker) throw new NotFoundException(`Broker ID ${brokerId} not found`);

    const lead = await this.leadRepo.findOne({ where: { id: dto.leadId } });
    if (!lead) throw new NotFoundException(`Lead ID ${dto.leadId} not found`);

    // Deactivate previous active broker assignments for this lead
    await this.leadAssignRepo.update({ lead: { id: dto.leadId } }, { isActive: false });

    const assign = new LeadBrokerAssignment();
    assign.broker = broker;
    assign.lead = lead;
    assign.assignedDate = new Date();
    assign.assignedBy = user;
    assign.isActive = true;
    assign.remarks = dto.remarks || undefined;

    // Check if the Lead source needs to be set to "Broker"
    // (Helps with CRM attribution mapping)
    if (lead.leadSource?.sourceName !== 'Broker') {
      const brokerSource = await this.leadRepo.manager.getRepository(LeadSource).findOne({ where: { sourceName: 'Broker' } });
      if (brokerSource) {
        lead.leadSource = brokerSource;
        await this.leadRepo.save(lead);
      }
    }

    return this.leadAssignRepo.save(assign);
  }

  async removeLeadAssignment(brokerId: number, assignmentId: number): Promise<void> {
    const assign = await this.leadAssignRepo.findOne({ where: { id: assignmentId, broker: { id: brokerId } } });
    if (!assign) throw new NotFoundException(`Lead Assignment ${assignmentId} not found`);
    assign.isActive = false;
    await this.leadAssignRepo.save(assign);
  }

  // =========================================================================
  // COMMISSION PLANS MASTER
  // =========================================================================
  async createCommissionPlan(dto: CreateCommissionPlanDto, user: string = 'SYSTEM'): Promise<CommissionPlan> {
    const plan = new CommissionPlan();
    plan.commissionPlanCode = dto.commissionPlanCode;
    plan.commissionPlanName = dto.commissionPlanName;
    plan.commissionTypeId = dto.commissionTypeId;
    plan.effectiveFromDate = new Date(dto.effectiveFromDate);
    if (dto.effectiveToDate) plan.effectiveToDate = new Date(dto.effectiveToDate);
    plan.statusId = 'ACTIVE';
    plan.createdBy = user;

    const savedPlan = await this.planRepo.save(plan);

    if (dto.details && dto.details.length > 0) {
      const details = dto.details.map((d) => {
        const detail = new CommissionPlanDetail();
        detail.commissionPlan = savedPlan;
        detail.fromAmount = d.fromAmount || undefined;
        detail.toAmount = d.toAmount || undefined;
        detail.fromUnits = d.fromUnits || undefined;
        detail.toUnits = d.toUnits || undefined;
        detail.commissionPercent = d.commissionPercent || undefined;
        detail.fixedAmount = d.fixedAmount || undefined;
        return detail;
      });
      await this.detailRepo.save(details);
    }

    return this.getCommissionPlanById(savedPlan.id);
  }

  async getCommissionPlans(): Promise<CommissionPlan[]> {
    return this.planRepo.find({ relations: { details: true }, order: { createdAt: 'DESC' } });
  }

  async getCommissionPlanById(id: number): Promise<CommissionPlan> {
    const plan = await this.planRepo.findOne({ where: { id }, relations: { details: true } });
    if (!plan) throw new NotFoundException(`Commission Plan ID ${id} not found`);
    return plan;
  }

  async assignProjectCommissionPlan(dto: AssignProjectCommissionPlanDto): Promise<ProjectCommissionPlan> {
    const property = await this.propertyRepo.findOne({ where: { id: dto.propertyId } });
    if (!property) throw new NotFoundException(`Property ID ${dto.propertyId} not found`);

    const commissionPlan = await this.planRepo.findOne({ where: { id: dto.commissionPlanId } });
    if (!commissionPlan) throw new NotFoundException(`Commission Plan ID ${dto.commissionPlanId} not found`);

    const mapping = new ProjectCommissionPlan();
    mapping.property = property;
    mapping.commissionPlan = commissionPlan;
    mapping.effectiveFromDate = new Date(dto.effectiveFromDate);
    if (dto.effectiveToDate) mapping.effectiveToDate = new Date(dto.effectiveToDate);

    return this.projPlanRepo.save(mapping);
  }

  async getAllProjectCommissionPlans(): Promise<ProjectCommissionPlan[]> {
    return this.projPlanRepo.find({
      relations: { property: true, commissionPlan: true },
      order: { createdAt: 'DESC' },
    });
  }

  async getProjectCommissionPlans(propertyId: number): Promise<ProjectCommissionPlan[]> {
    return this.projPlanRepo.find({
      where: { property: { id: propertyId } },
      relations: { commissionPlan: true },
    });
  }

  // =========================================================================
  // SALES ATTRIBUTION & COMMISSIONS LOGIC
  // =========================================================================
  async logBrokerSale(dto: CreateBrokerSaleDto): Promise<any> {
    const broker = await this.brokerRepo.findOne({ where: { id: dto.brokerId } });
    if (!broker) throw new NotFoundException(`Broker ID ${dto.brokerId} not found`);

    const customer = await this.customerRepo.findOne({ where: { id: dto.customerId } });
    if (!customer) throw new NotFoundException(`Customer ID ${dto.customerId} not found`);

    const property = await this.propertyRepo.findOne({ where: { id: dto.propertyId } });
    if (!property) throw new NotFoundException(`Property ID ${dto.propertyId} not found`);

    const sale = new BrokerSale();
    sale.broker = broker;
    sale.customer = customer;
    sale.property = property;
    sale.saleAmount = dto.saleAmount;
    sale.saleDate = new Date(dto.saleDate);
    sale.saleStatusId = 'ACTIVE';

    if (dto.reservationId) {
      const res = await this.reservationRepo.findOne({ where: { id: dto.reservationId } });
      if (res) sale.reservation = res;
    }
    if (dto.salesContractId) {
      const con = await this.contractRepo.findOne({ where: { id: dto.salesContractId } });
      if (con) sale.salesContract = con;
    }

    const savedSale = await this.saleRepo.save(sale);

    // Calculate commission
    await this.calculateCommissionForSale(savedSale);

    return savedSale;
  }

  async getSalesAttributed(): Promise<BrokerSale[]> {
    return this.saleRepo.find({
      relations: { broker: true, customer: true, property: true, reservation: true, salesContract: true },
      order: { saleDate: 'DESC' },
    });
  }

  private async calculateCommissionForSale(sale: BrokerSale): Promise<void> {
    const saleDate = sale.saleDate;
    const propId = sale.property.id;

    // 1. Search for project commission plans
    const mappings = await this.projPlanRepo.find({
      where: { property: { id: propId } },
      relations: { commissionPlan: { details: true } },
    });

    let selectedPlan: CommissionPlan | null = null;
    for (const mapping of mappings) {
      const fromDate = new Date(mapping.effectiveFromDate);
      const toDate = mapping.effectiveToDate ? new Date(mapping.effectiveToDate) : null;
      if (saleDate >= fromDate && (!toDate || saleDate <= toDate)) {
        selectedPlan = mapping.commissionPlan;
        break;
      }
    }

    // 2. If no project plan, select default commission plan
    if (!selectedPlan) {
      selectedPlan = await this.planRepo.findOne({
        where: { statusId: 'ACTIVE' },
        relations: { details: true },
        order: { createdAt: 'DESC' },
      });
    }

    if (!selectedPlan) {
      console.warn(`[COMMISSION CALCULATION] No active commission plan found for sale attributable to broker ${sale.broker.id}`);
      return;
    }

    let calculatedAmount = 0;
    let rate: number | null = null;

    const details = selectedPlan.details || [];
    const type = selectedPlan.commissionTypeId;

    if (type === 'PERCENTAGE') {
      const pct = details.length > 0 ? Number(details[0].commissionPercent) : 5; // Default 5%
      rate = pct;
      calculatedAmount = sale.saleAmount * (pct / 100);
    } else if (type === 'FIXED') {
      calculatedAmount = details.length > 0 ? Number(details[0].fixedAmount) : 50000; // Default 50k
      rate = 0;
    } else if (type === 'TIERED') {
      const matched = details.find((d) => {
        const from = d.fromAmount ? Number(d.fromAmount) : 0;
        const to = d.toAmount ? Number(d.toAmount) : Infinity;
        return sale.saleAmount >= from && sale.saleAmount <= to;
      });

      if (matched) {
        if (matched.commissionPercent) {
          rate = Number(matched.commissionPercent);
          calculatedAmount = sale.saleAmount * (rate / 100);
        } else if (matched.fixedAmount) {
          calculatedAmount = Number(matched.fixedAmount);
          rate = 0;
        }
      } else {
        // Default to percentage check
        const pct = details.length > 0 ? Number(details[0].commissionPercent || 5) : 5;
        rate = pct;
        calculatedAmount = sale.saleAmount * (pct / 100);
      }
    }

    const commission = new BrokerCommission();
    commission.brokerSale = sale;
    commission.broker = sale.broker;
    commission.commissionPlan = selectedPlan;
    commission.saleAmount = sale.saleAmount;
    commission.commissionRate = rate || undefined;
    commission.commissionAmount = calculatedAmount;
    commission.statusId = 'PENDING';
    commission.calculatedDate = new Date();

    await this.commissionRepo.save(commission);

    // Refresh KPI snapshots
    await this.refreshBrokerSnapshot(sale.broker.id);
  }

  // =========================================================================
  // COMMISSIONS RETRIEVAL & ACTIONS
  // =========================================================================
  async getCommissions(): Promise<BrokerCommission[]> {
    return this.commissionRepo.find({
      relations: {
        brokerSale: { customer: true, property: true },
        broker: true,
        commissionPlan: true,
        adjustments: true,
      },
      order: { calculatedDate: 'DESC' },
    });
  }

  async approveCommission(id: number, approvedBy: string): Promise<BrokerCommission> {
    const commission = await this.commissionRepo.findOne({ where: { id }, relations: { broker: true } });
    if (!commission) throw new NotFoundException(`Commission ID ${id} not found`);

    commission.statusId = 'APPROVED';
    commission.approvedBy = approvedBy;
    commission.approvedDate = new Date();

    const saved = await this.commissionRepo.save(commission);
    await this.refreshBrokerSnapshot(commission.broker.id);
    return saved;
  }

  async addAdjustment(commissionId: number, dto: CreateAdjustmentDto, approvedBy: string): Promise<BrokerCommissionAdjustment> {
    const commission = await this.commissionRepo.findOne({ where: { id: commissionId }, relations: { broker: true } });
    if (!commission) throw new NotFoundException(`Commission ID ${commissionId} not found`);

    const adj = new BrokerCommissionAdjustment();
    adj.brokerCommission = commission;
    adj.adjustmentTypeId = dto.adjustmentTypeId;
    adj.adjustmentAmount = dto.adjustmentAmount;
    adj.reason = dto.reason;
    adj.approvedBy = approvedBy;
    adj.approvedDate = new Date();
    adj.createdBy = approvedBy;

    const savedAdj = await this.adjustmentRepo.save(adj);

    // Adjust commission amount
    if (dto.adjustmentTypeId === 'INCREASE') {
      commission.commissionAmount = Number(commission.commissionAmount) + Number(dto.adjustmentAmount);
    } else {
      commission.commissionAmount = Number(commission.commissionAmount) - Number(dto.adjustmentAmount);
    }

    await this.commissionRepo.save(commission);
    await this.refreshBrokerSnapshot(commission.broker.id);

    return savedAdj;
  }

  // =========================================================================
  // PAYOUT LEDGER
  // =========================================================================
  async recordPayment(dto: RecordPaymentDto, user: string = 'SYSTEM'): Promise<CommissionPayment> {
    if (!dto.allocations || dto.allocations.length === 0) {
      throw new BadRequestException('At least one allocation is required');
    }

    // Grab first commission to link broker
    const firstComm = await this.commissionRepo.findOne({
      where: { id: dto.allocations[0].brokerCommissionId },
      relations: { broker: true },
    });
    if (!firstComm) throw new NotFoundException('Commission records not found');

    const payment = new CommissionPayment();
    payment.broker = firstComm.broker;
    payment.paymentReference = dto.paymentReference;
    payment.paymentDate = new Date(dto.paymentDate);
    payment.paymentMethodId = dto.paymentMethodId;
    payment.statusId = 'PAID';
    payment.totalAmount = dto.allocations.reduce((sum, a) => sum + a.amountPaid, 0);
    payment.createdBy = user;

    const savedPayment = await this.paymentRepo.save(payment);

    for (const alloc of dto.allocations) {
      const commission = await this.commissionRepo.findOne({ where: { id: alloc.brokerCommissionId } });
      if (commission) {
        const detail = new CommissionPaymentDetail();
        detail.commissionPayment = savedPayment;
        detail.brokerCommission = commission;
        detail.amountPaid = alloc.amountPaid;
        await this.payDetailRepo.save(detail);

        // Update commission status to PAID
        commission.statusId = 'PAID';
        await this.commissionRepo.save(commission);
      }
    }

    await this.refreshBrokerSnapshot(firstComm.broker.id);

    return savedPayment;
  }

  async getPayments(): Promise<CommissionPayment[]> {
    return this.paymentRepo.find({ relations: { broker: true }, order: { paymentDate: 'DESC' } });
  }

  // =========================================================================
  // PERFORMANCE SNAPSHOTS & TARGETS
  // =========================================================================
  async setTarget(brokerId: number, dto: SetTargetDto): Promise<BrokerTarget> {
    const broker = await this.brokerRepo.findOne({ where: { id: brokerId } });
    if (!broker) throw new NotFoundException(`Broker ID ${brokerId} not found`);

    let target = await this.targetRepo.findOne({
      where: { broker: { id: brokerId }, yearNumber: dto.yearNumber, monthNumber: dto.monthNumber },
    });

    if (!target) {
      target = new BrokerTarget();
      target.broker = broker;
      target.yearNumber = dto.yearNumber;
      target.monthNumber = dto.monthNumber;
    }

    target.salesTargetCount = dto.salesTargetCount;
    target.salesTargetAmount = dto.salesTargetAmount;
    if (dto.commissionTarget !== undefined) target.commissionTarget = dto.commissionTarget;

    return this.targetRepo.save(target);
  }

  async getTargets(brokerId: number): Promise<BrokerTarget[]> {
    return this.targetRepo.find({ where: { broker: { id: brokerId } }, order: { yearNumber: 'DESC', monthNumber: 'DESC' } });
  }

  async refreshBrokerSnapshot(brokerId: number): Promise<void> {
    const broker = await this.brokerRepo.findOne({ where: { id: brokerId } });
    if (!broker) return;

    const leads = await this.leadAssignRepo.count({ where: { broker: { id: brokerId }, isActive: true } });
    
    // Attributed sales
    const sales = await this.saleRepo.find({ where: { broker: { id: brokerId }, saleStatusId: 'ACTIVE' } });
    const salesCount = sales.length;
    const salesValue = sales.reduce((sum, s) => sum + Number(s.saleAmount), 0);

    // Commissions
    const commissions = await this.commissionRepo.find({ where: { broker: { id: brokerId } } });
    const commissionEarned = commissions.reduce((sum, c) => sum + Number(c.commissionAmount), 0);
    
    // Paid commissions
    const paidCommissions = commissions.filter(c => c.statusId === 'PAID');
    const commissionPaid = paidCommissions.reduce((sum, c) => sum + Number(c.commissionAmount), 0);

    // Conversion rate count
    const conversionRate = leads > 0 ? (salesCount / leads) : 0;

    let snapshot = await this.snapshotRepo.findOne({
      where: { broker: { id: brokerId }, snapshotDate: new Date() },
    });

    if (!snapshot) {
      snapshot = new BrokerPerformanceSnapshot();
      snapshot.broker = broker;
      snapshot.snapshotDate = new Date();
    }

    snapshot.leadsAssigned = leads;
    snapshot.reservationsCreated = sales.filter(s => s.reservation !== null).length;
    snapshot.salesCount = salesCount;
    snapshot.salesValue = salesValue;
    snapshot.commissionEarned = commissionEarned;
    snapshot.commissionPaid = commissionPaid;
    snapshot.conversionRate = conversionRate;

    await this.snapshotRepo.save(snapshot);
  }

  async getDashboardStats(): Promise<any> {
    const brokersCount = await this.brokerRepo.count({ where: { statusId: 'ACTIVE' } });
    
    const sales = await this.saleRepo.find({ where: { saleStatusId: 'ACTIVE' }, relations: { broker: true } });
    const totalSalesValue = sales.reduce((sum, s) => sum + Number(s.saleAmount), 0);

    const commissions = await this.commissionRepo.find({ relations: { broker: true } });
    const totalEarnedCommissions = commissions.reduce((sum, c) => sum + Number(c.commissionAmount), 0);
    const paidCommissions = commissions.filter(c => c.statusId === 'PAID');
    const totalPaidCommissions = paidCommissions.reduce((sum, c) => sum + Number(c.commissionAmount), 0);

    // Leaderboard
    const brokers = await this.brokerRepo.find();
    const leaderboard: any[] = [];
    for (const b of brokers) {
      const bSales = sales.filter((s) => s.broker.id === b.id);
      const val = bSales.reduce((sum, s) => sum + Number(s.saleAmount), 0);
      const comm = commissions.filter((c) => c.broker.id === b.id).reduce((sum, c) => sum + Number(c.commissionAmount), 0);
      if (bSales.length > 0 || comm > 0) {
        leaderboard.push({
          id: b.id,
          brokerName: b.brokerName,
          brokerCode: b.brokerCode,
          brokerTypeId: b.brokerTypeId,
          salesCount: bSales.length,
          salesValue: val,
          commissionEarned: comm,
        });
      }
    }
    leaderboard.sort((a, b) => b.salesValue - a.salesValue);

    return {
      brokersCount,
      totalSalesValue,
      totalEarnedCommissions,
      totalPaidCommissions,
      leaderboard: leaderboard.slice(0, 5), // top 5
    };
  }

  async handleSalesEvent(event: 'RESERVATION_CREATED' | 'BOOKING_APPROVED' | 'CONTRACT_CREATED' | 'CONTRACT_CANCELLED', entity: any): Promise<void> {
    try {
      let customerId: number | null = null;
      let propertyId: number | null = null;
      let amount = 0;
      let reservationId: number | null = null;
      let contractId: number | null = null;

      if (event === 'RESERVATION_CREATED') {
        customerId = entity.customer?.id;
        propertyId = entity.property?.id;
        amount = Number(entity.reservationFee || 0);
        reservationId = entity.id;
      } else if (event === 'BOOKING_APPROVED') {
        customerId = entity.customer?.id;
        propertyId = entity.property?.id;
        amount = Number(entity.bookingAmount || 0);
        reservationId = entity.reservation?.id || null;
      } else if (event === 'CONTRACT_CREATED') {
        customerId = entity.customer?.id;
        if (entity.agreement?.booking) {
          propertyId = entity.agreement.booking.property?.id;
          reservationId = entity.agreement.booking.reservation?.id || null;
        }
        amount = Number(entity.contractAmount || 0);
        contractId = entity.id;
      } else if (event === 'CONTRACT_CANCELLED') {
        const sale = await this.saleRepo.findOne({
          where: { salesContract: { id: entity.id } },
          relations: { broker: true }
        });
        if (sale) {
          sale.saleStatusId = 'CANCELLED';
          await this.saleRepo.save(sale);
          const commissions = await this.commissionRepo.find({
            where: { brokerSale: { id: sale.id } }
          });
          for (const c of commissions) {
            c.statusId = 'CANCELLED';
            await this.commissionRepo.save(c);
          }
          if (sale.broker) {
            await this.refreshBrokerSnapshot(sale.broker.id);
          }
        }
        return;
      }

      if (!customerId) return;

      const customer = await this.customerRepo.findOne({
        where: { id: customerId },
        relations: { lead: true }
      });
      if (!customer || !customer.lead) return;

      const assignment = await this.leadAssignRepo.findOne({
        where: { lead: { id: customer.lead.id }, isActive: true },
        relations: { broker: true }
      });
      if (!assignment || !assignment.broker) return;

      if (!propertyId && reservationId) {
        const res = await this.reservationRepo.findOne({ where: { id: reservationId }, relations: { property: true } });
        propertyId = res?.property?.id || null;
      }
      if (!propertyId) return;

      const sale = new BrokerSale();
      sale.broker = assignment.broker;
      sale.customer = customer;
      const property = await this.propertyRepo.findOne({ where: { id: propertyId } });
      if (!property) return;
      sale.property = property;
      sale.saleAmount = amount;
      sale.saleDate = new Date();
      sale.saleStatusId = 'ACTIVE';
      if (reservationId) sale.reservation = { id: reservationId } as any;
      if (contractId) sale.salesContract = { id: contractId } as any;

      const savedSale = await this.saleRepo.save(sale);
      await this.calculateCommissionForSale(savedSale);
    } catch (err) {
      console.error('[Broker Service] Error handling sales event auto-commission trigger:', err);
    }
  }
}
