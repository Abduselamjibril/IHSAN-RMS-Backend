import { Injectable, NotFoundException, BadRequestException, OnModuleInit, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DataSource } from 'typeorm';
import * as fs from 'fs';
import { join } from 'path';

// Entities
import { PaymentMethod } from '../entities/payment-method.entity';
import { Payment } from '../entities/payment.entity';
import { PaymentApproval } from '../entities/payment-approval.entity';
import { PaymentAllocation } from '../entities/payment-allocation.entity';
import { ReceiptTemplate } from '../entities/receipt-template.entity';
import { Receipt } from '../entities/receipt.entity';
import { PenaltyConfiguration } from '../entities/penalty-configuration.entity';
import { PenaltyTransaction } from '../entities/penalty-transaction.entity';
import { CustomerBalance } from '../entities/customer-balance.entity';
import { RevenueSummary } from '../entities/revenue-summary.entity';
import { NotificationTemplate } from '../entities/notification-template.entity';
import { ReminderConfiguration } from '../entities/reminder-configuration.entity';
import { PaymentReminder } from '../entities/payment-reminder.entity';

// CRM & Sales Entities
import { Customer } from '../../crm/entities/customer.entity';
import { SalesContract } from '../../sales/entities/sales-contract.entity';
import { InstallmentSchedule } from '../../sales/entities/installment-schedule.entity';

// DTOs
import {
  CreatePaymentMethodDto,
  CreatePaymentDto,
  ApprovePaymentDto,
  CreateReceiptTemplateDto,
  CreatePenaltyConfigDto,
  WaivePenaltyDto,
  CreateReminderConfigDto,
} from '../dto/finance.dto';

@Injectable()
export class FinanceService implements OnModuleInit {
  private readonly logger = new Logger(FinanceService.name);

  constructor(
    private readonly dataSource: DataSource,
    @InjectRepository(PaymentMethod) private readonly methodRepo: Repository<PaymentMethod>,
    @InjectRepository(Payment) private readonly paymentRepo: Repository<Payment>,
    @InjectRepository(PaymentApproval) private readonly approvalRepo: Repository<PaymentApproval>,
    @InjectRepository(PaymentAllocation) private readonly allocationRepo: Repository<PaymentAllocation>,
    @InjectRepository(ReceiptTemplate) private readonly receiptTemplateRepo: Repository<ReceiptTemplate>,
    @InjectRepository(Receipt) private readonly receiptRepo: Repository<Receipt>,
    @InjectRepository(PenaltyConfiguration) private readonly penaltyConfigRepo: Repository<PenaltyConfiguration>,
    @InjectRepository(PenaltyTransaction) private readonly penaltyTxRepo: Repository<PenaltyTransaction>,
    @InjectRepository(CustomerBalance) private readonly balanceRepo: Repository<CustomerBalance>,
    @InjectRepository(RevenueSummary) private readonly revenueRepo: Repository<RevenueSummary>,
    @InjectRepository(NotificationTemplate) private readonly notifyTemplateRepo: Repository<NotificationTemplate>,
    @InjectRepository(ReminderConfiguration) private readonly reminderConfigRepo: Repository<ReminderConfiguration>,
    @InjectRepository(PaymentReminder) private readonly reminderRepo: Repository<PaymentReminder>,
    @InjectRepository(Customer) private readonly customerRepo: Repository<Customer>,
    @InjectRepository(SalesContract) private readonly contractRepo: Repository<SalesContract>,
    @InjectRepository(InstallmentSchedule) private readonly scheduleRepo: Repository<InstallmentSchedule>,
  ) {}

  async onModuleInit() {
    this.logger.log('Finance Module initialized. Seeding metadata configurations...');

    // 1. Ensure uploads/receipts folder exists
    const receiptsDir = join(__dirname, '..', '..', '..', '..', 'uploads', 'receipts');
    if (!fs.existsSync(receiptsDir)) {
      fs.mkdirSync(receiptsDir, { recursive: true });
    }

    try {
      // 2. Create the Customer Statement view programmatically in DB
      await this.dataSource.query(`
        CREATE OR REPLACE VIEW vw_rems_customer_statement AS
        SELECT
            c.id as customer_id,
            sc.contract_id as contract_id,
            sc.contract_number as contract_number,
            sc.property_price as property_price,
            COALESCE((SELECT SUM(p.payment_amount) FROM rems_payment p WHERE p.contract_id = sc.contract_id AND p.payment_status = 'APPROVED'), 0) as total_paid,
            COALESCE((SELECT SUM(pt.penalty_amount) FROM rems_penalty_transaction pt JOIN rems_installment_schedule sch ON pt.installment_id = sch.installment_id WHERE sch.contract_id = sc.contract_id AND pt.waived = false), 0) as total_penalty,
            sc.property_price
                - COALESCE((SELECT SUM(p.payment_amount) FROM rems_payment p WHERE p.contract_id = sc.contract_id AND p.payment_status = 'APPROVED'), 0)
                + COALESCE((SELECT SUM(pt.penalty_amount) FROM rems_penalty_transaction pt JOIN rems_installment_schedule sch ON pt.installment_id = sch.installment_id WHERE sch.contract_id = sc.contract_id AND pt.waived = false), 0)
                AS outstanding_balance
        FROM rems_sales_contract sc
        JOIN crm_customer c ON c.id = sc.customer_id;
      `);
      this.logger.log('vw_rems_customer_statement View synced successfully.');
    } catch (err) {
      this.logger.warn('Could not create raw PostgreSQL view. Proceeding with in-memory fallback.', err.message);
    }

    // 3. Seed default Payment Methods if empty
    const methodCount = await this.methodRepo.count();
    if (methodCount === 0) {
      const methods = [
        { paymentMethodName: 'Cash', paymentMethodCode: 'CASH' },
        { paymentMethodName: 'Bank Transfer', paymentMethodCode: 'BANK' },
        { paymentMethodName: 'Cheque', paymentMethodCode: 'CHEQUE' },
        { paymentMethodName: 'Mobile Payment', paymentMethodCode: 'MOBILE' },
        { paymentMethodName: 'Telebirr', paymentMethodCode: 'TELEBIRR' },
        { paymentMethodName: 'Chapa', paymentMethodCode: 'CHAPA' },
      ];
      await this.methodRepo.save(this.methodRepo.create(methods));
      this.logger.log('Default Payment Methods seeded.');
    }

    // 4. Seed default Receipt Template if empty
    const templateCount = await this.receiptTemplateRepo.count();
    if (templateCount === 0) {
      await this.receiptTemplateRepo.save(
        this.receiptTemplateRepo.create({
          templateName: 'Standard REMS Receipt',
          headerText: 'IHSAN Properties & Business Service PLC',
          footerText: 'Thank you for your purchase. Please retain this copy for audit verification.',
          signatureText: 'Authorized Finance Officer Seal',
          qrEnabled: true,
          isDefault: true,
        }),
      );
      this.logger.log('Default Receipt Template seeded.');
    }

    // 5. Seed default Reminder Config if empty
    const reminderCount = await this.reminderConfigRepo.count();
    if (reminderCount === 0) {
      await this.reminderConfigRepo.save(
        this.reminderConfigRepo.create({
          reminderDaysBeforeDue: 5,
          reminderDaysAfterDue: 3,
          smsEnabled: true,
          emailEnabled: true,
          telegramEnabled: true,
          isActive: true,
        }),
      );
    }

    // 6. Seed default Penalty Config if empty
    const penaltyCount = await this.penaltyConfigRepo.count();
    if (penaltyCount === 0) {
      await this.penaltyConfigRepo.save(
        this.penaltyConfigRepo.create({
          gracePeriodDays: 10,
          penaltyType: 'PERCENTAGE',
          penaltyPercentage: 2.0,
          isActive: true,
        }),
      );
    }
  }

  // --- Payment Method CRUD ---
  async getPaymentMethods(): Promise<PaymentMethod[]> {
    return this.methodRepo.find({ where: { isActive: true } });
  }

  async createPaymentMethod(dto: CreatePaymentMethodDto): Promise<PaymentMethod> {
    const existing = await this.methodRepo.findOne({ where: { paymentMethodCode: dto.paymentMethodCode } });
    if (existing) throw new BadRequestException('Payment method code already exists.');
    const m = this.methodRepo.create(dto);
    return this.methodRepo.save(m);
  }

  // --- Payment Transactions ---
  async createPayment(dto: CreatePaymentDto): Promise<Payment> {
    if (dto.paymentAmount >= 1e16) {
      throw new BadRequestException('Payment amount exceeds maximum permitted precision (16 digits).');
    }
    const contract = await this.contractRepo.findOne({ where: { id: dto.contractId } });
    if (!contract) throw new NotFoundException('Contract reference not found.');

    const customer = await this.customerRepo.findOne({ where: { id: dto.customerId } });
    if (!customer) throw new NotFoundException('Customer profile not found.');

    const method = await this.methodRepo.findOne({ where: { id: dto.paymentMethodId } });
    if (!method) throw new NotFoundException('Payment method code not found.');

    const reference = dto.paymentReference || 'PAY-' + Date.now().toString().slice(-8);

    const payment = this.paymentRepo.create({
      paymentReference: reference,
      contract,
      customer,
      paymentMethod: method,
      paymentDate: new Date(dto.paymentDate),
      paymentAmount: dto.paymentAmount,
      bankName: dto.bankName,
      transactionReference: dto.transactionReference,
      chequeNumber: dto.chequeNumber,
      status: 'PENDING',
      remarks: dto.remarks,
    });

    const saved = await this.paymentRepo.save(payment);
    await this.updateCustomerBalance(contract.id, customer.id);
    return saved;
  }

  async getPayments(filters: any = {}): Promise<Payment[]> {
    const query = this.paymentRepo.createQueryBuilder('p')
      .leftJoinAndSelect('p.contract', 'c')
      .leftJoinAndSelect('p.customer', 'cust')
      .leftJoinAndSelect('p.paymentMethod', 'm')
      .orderBy('p.createdAt', 'DESC');

    if (filters.contractId) {
      query.andWhere('c.contract_id = :cid', { cid: +filters.contractId });
    }
    if (filters.customerId) {
      query.andWhere('cust.customer_id = :custid', { custid: +filters.customerId });
    }
    if (filters.status) {
      query.andWhere('p.payment_status = :status', { status: filters.status });
    }

    return query.getMany();
  }

  async getPayment(id: number): Promise<Payment> {
    const payment = await this.paymentRepo.findOne({
      where: { id },
      relations: { contract: true, customer: true, paymentMethod: true },
    });
    if (!payment) throw new NotFoundException('Payment transaction not found.');
    return payment;
  }

  // --- Payment Approval Workflow & Allocation FIFO ---
  async approvePayment(id: number, approverId: number, dto: ApprovePaymentDto): Promise<Payment> {
    const payment = await this.paymentRepo.findOne({
      where: { id },
      relations: { contract: true, customer: true, paymentMethod: true },
    });
    if (!payment) throw new NotFoundException('Payment not found.');
    if (payment.status !== 'PENDING') {
      throw new BadRequestException(`Cannot approve payment. Current status: ${payment.status}`);
    }

    payment.status = 'APPROVED';
    const savedPayment = await this.paymentRepo.save(payment);

    // 1. Log approval details
    const approval = this.approvalRepo.create({
      payment: savedPayment,
      approvalStatus: 'APPROVED',
      approvalComment: dto.approvalComment || 'Payment approved and verified.',
      approvedBy: approverId,
      approvalDate: new Date(),
    });
    await this.approvalRepo.save(approval);

    // 2. FIFO Allocation engine
    // Load all pending or partial schedules for this contract ordered by installmentNo ASC
    const schedules = await this.scheduleRepo.find({
      where: { contract: { id: payment.contract.id } },
      order: { installmentNo: 'ASC' },
    });

    let remainingAmount = Number(payment.paymentAmount);
    const allocations: PaymentAllocation[] = [];

    for (const schedule of schedules) {
      if (remainingAmount <= 0) break;

      const scheduleTotal = Number(schedule.installmentAmount) + Number(schedule.penaltyAmount);
      const schedulePaid = Number(schedule.paidAmount || 0);
      const scheduleOutstanding = Math.max(0, scheduleTotal - schedulePaid);

      if (scheduleOutstanding <= 0) continue;

      const allocated = Math.min(remainingAmount, scheduleOutstanding);
      schedule.paidAmount = schedulePaid + allocated;
      schedule.outstandingAmount = Math.max(0, scheduleTotal - schedule.paidAmount);
      schedule.status = schedule.outstandingAmount === 0 ? 'PAID' : 'PARTIAL';
      if (schedule.status === 'PAID') {
        schedule.paymentDate = new Date();
      }

      await this.scheduleRepo.save(schedule);

      const allocation = this.allocationRepo.create({
        payment: savedPayment,
        installment: schedule,
        allocatedAmount: allocated,
      });
      allocations.push(allocation);

      remainingAmount -= allocated;
    }

    if (allocations.length > 0) {
      await this.allocationRepo.save(allocations);
    }

    // 3. Generate Receipt & PDF file mockup
    const receiptNo = 'REC-' + Date.now().toString().slice(-8);
    const defaultTemplate = await this.receiptTemplateRepo.findOne({ where: { isDefault: true } });

    const receiptPdfName = `receipt-PAY-${payment.id}.pdf`;
    const receiptPdfPath = join(__dirname, '..', '..', '..', '..', 'uploads', 'receipts', receiptPdfName);

    // Write mock receipt file text inside PDF named file for E2E testing
    const receiptContent = `
========================================
RECEIPT INVOICE: ${receiptNo}
========================================
Date: ${new Date().toLocaleDateString()}
Payment Reference: ${payment.paymentReference}
Customer: ${payment.customer.fullName}
Contract No: ${payment.contract.contractNo}
Amount Paid: ETB ${payment.paymentAmount.toLocaleString()}
Payment Method: ${payment.paymentMethod.paymentMethodName}
----------------------------------------
Outstanding Balance Remaining: ETB ${(Number(payment.contract.contractAmount) - Number(payment.paymentAmount)).toLocaleString()}
========================================
${defaultTemplate?.headerText || 'IHSAN Properties'}
${defaultTemplate?.footerText || ''}
${defaultTemplate?.signatureText || ''}
`;
    fs.writeFileSync(receiptPdfPath, receiptContent);

    const receipt = this.receiptRepo.create({
      receiptNumber: receiptNo,
      payment: savedPayment,
      receiptTemplate: defaultTemplate,
      receiptDate: new Date(),
      pdfUrl: `/uploads/receipts/${receiptPdfName}`,
      generatedBy: approverId,
    });
    await this.receiptRepo.save(receipt);

    // 4. Update balance snapshot
    await this.updateCustomerBalance(payment.contract.id, payment.customer.id);

    return savedPayment;
  }

  async rejectPayment(id: number, approverId: number, dto: ApprovePaymentDto): Promise<Payment> {
    const payment = await this.paymentRepo.findOne({ where: { id } });
    if (!payment) throw new NotFoundException('Payment not found.');
    if (payment.status !== 'PENDING') {
      throw new BadRequestException(`Cannot reject payment. Current status: ${payment.status}`);
    }

    payment.status = 'REJECTED';
    const saved = await this.paymentRepo.save(payment);

    const approval = this.approvalRepo.create({
      payment: saved,
      approvalStatus: 'REJECTED',
      approvalComment: dto.approvalComment || 'Payment verification failed.',
      approvedBy: approverId,
      approvalDate: new Date(),
    });
    await this.approvalRepo.save(approval);

    return saved;
  }

  // --- Payment Reversals ---
  async reversePayment(id: number, approverId: number, comment: string): Promise<Payment> {
    const payment = await this.paymentRepo.findOne({
      where: { id },
      relations: { contract: true, customer: true },
    });
    if (!payment) throw new NotFoundException('Payment not found.');
    if (payment.status !== 'APPROVED') {
      throw new BadRequestException('Only approved payments can be reversed.');
    }

    payment.status = 'REVERSED';
    const saved = await this.paymentRepo.save(payment);

    // 1. Revert allocations
    const allocations = await this.allocationRepo.find({
      where: { payment: { id: payment.id } },
      relations: { installment: true },
    });

    for (const alloc of allocations) {
      const schedule = alloc.installment;
      schedule.paidAmount = Math.max(0, Number(schedule.paidAmount || 0) - Number(alloc.allocatedAmount));
      const scheduleTotal = Number(schedule.installmentAmount) + Number(schedule.penaltyAmount);
      schedule.outstandingAmount = Math.max(0, scheduleTotal - schedule.paidAmount);
      schedule.status = schedule.paidAmount === 0 ? 'PENDING' : 'PARTIAL';
      schedule.paymentDate = null as any;
      await this.scheduleRepo.save(schedule);
      await this.allocationRepo.remove(alloc);
    }

    // 2. Delete linked receipt
    const receipt = await this.receiptRepo.findOne({ where: { payment: { id: payment.id } } });
    if (receipt) {
      const receiptPdfPath = join(__dirname, '..', '..', '..', '..', 'uploads', 'receipts', `receipt-PAY-${payment.id}.pdf`);
      if (fs.existsSync(receiptPdfPath)) {
        try { fs.unlinkSync(receiptPdfPath); } catch {}
      }
      await this.receiptRepo.remove(receipt);
    }

    // 3. Log reversal comment
    const reversalLog = this.approvalRepo.create({
      payment: saved,
      approvalStatus: 'REJECTED',
      approvalComment: comment || 'Payment reversed and rolled back.',
      approvedBy: approverId,
      approvalDate: new Date(),
    });
    await this.approvalRepo.save(reversalLog);

    await this.updateCustomerBalance(payment.contract.id, payment.customer.id);

    return saved;
  }

  // --- Reschedule Installments ---
  async rescheduleInstallment(id: number, dueDate: string, amount: number): Promise<InstallmentSchedule> {
    const schedule = await this.scheduleRepo.findOne({
      where: { id },
      relations: { contract: true },
    });
    if (!schedule) throw new NotFoundException('Installment not found.');

    schedule.dueDate = new Date(dueDate);
    schedule.installmentAmount = amount;
    const scheduleTotal = Number(schedule.installmentAmount) + Number(schedule.penaltyAmount);
    schedule.outstandingAmount = Math.max(0, scheduleTotal - Number(schedule.paidAmount));
    schedule.status = schedule.outstandingAmount === 0 ? 'PAID' : (schedule.paidAmount > 0 ? 'PARTIAL' : 'PENDING');
    
    const saved = await this.scheduleRepo.save(schedule);
    await this.updateCustomerBalance(schedule.contract.id, schedule.contract.customer.id);
    return saved;
  }

  // --- Penalty Calculations ---
  async getPenaltyConfigs(): Promise<PenaltyConfiguration[]> {
    return this.penaltyConfigRepo.find({ order: { id: 'DESC' } }); // Display newest first
  }

  async createPenaltyConfig(dto: CreatePenaltyConfigDto): Promise<PenaltyConfiguration> {
    if (dto.isActive) {
      // Set all other active configurations to inactive
      await this.penaltyConfigRepo.update({ isActive: true }, { isActive: false });
    }
    const config = this.penaltyConfigRepo.create(dto);
    return this.penaltyConfigRepo.save(config);
  }

  async deletePenaltyConfig(id: number): Promise<any> {
    const config = await this.penaltyConfigRepo.findOne({ where: { id } });
    if (!config) throw new NotFoundException('Penalty configuration not found.');
    await this.penaltyConfigRepo.remove(config);
    return { success: true, message: 'Penalty configuration deleted successfully.' };
  }

  async runDailyPenaltySweeper(): Promise<any> {
    const today = new Date();
    // Load all pending/partial/overdue schedules
    const schedules = await this.scheduleRepo.find({
      where: [
        { status: 'PENDING' },
        { status: 'PARTIAL' },
        { status: 'OVERDUE' },
      ],
      relations: { contract: { customer: true } },
    });

    const activeConfig = await this.penaltyConfigRepo.findOne({ where: { isActive: true } });
    if (!activeConfig) {
      return { success: true, processedCount: 0, appliedPenalties: 0, remarks: 'No active penalty rules configured.' };
    }

    let processedCount = 0;
    let appliedPenalties = 0;
    const gracePeriod = activeConfig.gracePeriodDays;

    for (const schedule of schedules) {
      const due = new Date(schedule.dueDate);
      const graceLimit = new Date(due.getTime());
      graceLimit.setDate(graceLimit.getDate() + gracePeriod);

      if (today > graceLimit) {
        processedCount++;

        // Calculate late fee penalty amount
        let penalty = 0;
        if (activeConfig.penaltyType === 'FIXED') {
          penalty = Number(activeConfig.fixedPenaltyAmount);
        } else if (activeConfig.penaltyType === 'PERCENTAGE') {
          penalty = Number(schedule.installmentAmount) * (Number(activeConfig.penaltyPercentage) / 100);
        } else if (activeConfig.penaltyType === 'MONTHLY') {
          const daysLate = Math.max(1, Math.floor((today.getTime() - due.getTime()) / (24 * 60 * 60 * 1000)));
          const monthsLate = Math.max(1, Math.ceil(daysLate / 30));
          penalty = Number(schedule.installmentAmount) * (Number(activeConfig.monthlyPenaltyRate) / 100) * monthsLate;
        }

        // Check if a penalty transaction was already run for this schedule today to prevent daily double accruals
        const existingTx = await this.penaltyTxRepo.findOne({
          where: { installment: { id: schedule.id }, penaltyDate: today },
        });

        if (penalty > 0 && !existingTx) {
          appliedPenalties += penalty;

          // Create penalty transaction
          const tx = this.penaltyTxRepo.create({
            installment: schedule,
            penaltyDate: today,
            penaltyAmount: penalty,
            waived: false,
          });
          await this.penaltyTxRepo.save(tx);

          // Recalculate schedule balances
          schedule.penaltyAmount = Number(schedule.penaltyAmount) + penalty;
          const scheduleTotal = Number(schedule.installmentAmount) + schedule.penaltyAmount;
          schedule.outstandingAmount = Math.max(0, scheduleTotal - Number(schedule.paidAmount));
          schedule.status = 'OVERDUE';
          await this.scheduleRepo.save(schedule);

          await this.updateCustomerBalance(schedule.contract.id, schedule.contract.customer.id);
        }
      }
    }

    // Save daily reporting snapshot
    if (processedCount > 0) {
      const summary = this.revenueRepo.create({
        reportingDate: today,
        totalCollections: 0,
        totalPenalties: appliedPenalties,
        totalRevenue: appliedPenalties,
        totalOutstanding: 0,
      });
      await this.revenueRepo.save(summary);
    }

    return {
      success: true,
      processedCount,
      appliedPenalties,
      remarks: `Executed late fees sweeper successfully. Penalties applied: ETB ${appliedPenalties.toLocaleString()}`,
    };
  }

  // --- Penalty Waivers ---
  async getPenaltyTransactions(): Promise<PenaltyTransaction[]> {
    return this.penaltyTxRepo.find({ relations: { installment: { contract: { customer: true } } } });
  }

  async waivePenalty(txId: number, waivedBy: number, dto: WaivePenaltyDto): Promise<PenaltyTransaction> {
    const tx = await this.penaltyTxRepo.findOne({
      where: { id: txId },
      relations: { installment: { contract: { customer: true } } },
    });
    if (!tx) throw new NotFoundException('Penalty transaction not found.');
    if (tx.waived) throw new BadRequestException('Penalty has already been waived.');

    tx.waived = true;
    tx.waivedBy = waivedBy;
    tx.waiverReason = dto.waiverReason;
    const savedTx = await this.penaltyTxRepo.save(tx);

    // Subtract fee from schedule
    const schedule = tx.installment;
    schedule.penaltyAmount = Math.max(0, Number(schedule.penaltyAmount) - Number(tx.penaltyAmount));
    const scheduleTotal = Number(schedule.installmentAmount) + schedule.penaltyAmount;
    schedule.outstandingAmount = Math.max(0, scheduleTotal - Number(schedule.paidAmount));
    schedule.status = schedule.outstandingAmount === 0 ? 'PAID' : (schedule.paidAmount > 0 ? 'PARTIAL' : 'PENDING');
    await this.scheduleRepo.save(schedule);

    await this.updateCustomerBalance(schedule.contract.id, schedule.contract.customer.id);

    return savedTx;
  }

  // --- Receipts Template & logs ---
  async getReceiptTemplates(): Promise<ReceiptTemplate[]> {
    return this.receiptTemplateRepo.find();
  }

  async updateReceiptTemplate(id: number, dto: CreateReceiptTemplateDto): Promise<ReceiptTemplate> {
    const template = await this.receiptTemplateRepo.findOne({ where: { id } });
    if (!template) throw new NotFoundException('Receipt template not found.');

    if (dto.templateName !== undefined) template.templateName = dto.templateName;
    if (dto.companyLogo !== undefined) template.companyLogo = dto.companyLogo;
    if (dto.headerText !== undefined) template.headerText = dto.headerText;
    if (dto.footerText !== undefined) template.footerText = dto.footerText;
    if (dto.signatureText !== undefined) template.signatureText = dto.signatureText;
    if (dto.qrEnabled !== undefined) template.qrEnabled = dto.qrEnabled;
    if (dto.isDefault !== undefined) template.isDefault = dto.isDefault;

    return this.receiptTemplateRepo.save(template);
  }

  async getReceipts(): Promise<Receipt[]> {
    return this.receiptRepo.find({ relations: { payment: { contract: { customer: true } } } });
  }

  async reprintReceipt(id: number): Promise<Receipt> {
    const r = await this.receiptRepo.findOne({ where: { id }, relations: { payment: true } });
    if (!r) throw new NotFoundException('Receipt reference not found.');
    r.receiptDate = new Date();
    return this.receiptRepo.save(r);
  }

  // --- Customer Outstanding Balance Calculations (Materialized) ---
  private async updateCustomerBalance(contractId: number, customerId: number): Promise<void> {
    const contract = await this.contractRepo.findOne({ where: { id: contractId } });
    const customer = await this.customerRepo.findOne({ where: { id: customerId } });
    if (!contract || !customer) return;

    // Sum approved payments
    const payments = await this.paymentRepo.find({
      where: { contract: { id: contractId }, status: 'APPROVED' },
    });
    const totalPaid = payments.reduce((sum, p) => sum + Number(p.paymentAmount), 0);

    // Sum active penalty charges
    const schedules = await this.scheduleRepo.find({
      where: { contract: { id: contractId } },
    });
    const totalPenalty = schedules.reduce((sum, s) => sum + Number(s.penaltyAmount), 0);

    const contractAmt = Number(contract.contractAmount);
    const outstanding = contractAmt + totalPenalty - totalPaid;

    let balance = await this.balanceRepo.findOne({
      where: { contract: { id: contractId }, customer: { id: customerId } },
    });

    if (!balance) {
      balance = this.balanceRepo.create({
        customer,
        contract,
        contractAmount: contractAmt,
        totalPaid,
        totalPenalty,
        outstandingBalance: outstanding,
        lastUpdated: new Date(),
      });
    } else {
      balance.contractAmount = contractAmt;
      balance.totalPaid = totalPaid;
      balance.totalPenalty = totalPenalty;
      balance.outstandingBalance = outstanding;
      balance.lastUpdated = new Date();
    }

    await this.balanceRepo.save(balance);
  }

  async getCustomerBalances(): Promise<CustomerBalance[]> {
    return this.balanceRepo.find({ relations: { customer: true, contract: true } });
  }

  // --- Statements & Reports (Epic 4.5 & 4.6) ---
  async getCustomerStatement(customerId: number): Promise<any[]> {
    try {
      // Query raw statement database view
      return this.dataSource.query(`
        SELECT * FROM vw_rems_customer_statement WHERE customer_id = $1;
      `, [customerId]);
    } catch {
      // In-memory fallback if view not created (SQLite compatibility)
      const contracts = await this.contractRepo.find({
        where: { customer: { id: customerId } },
        relations: { customer: true },
      });
      const results: any[] = [];
      for (const sc of contracts) {
        const approvedPayments = await this.paymentRepo.find({
          where: { contract: { id: sc.id }, status: 'APPROVED' },
        });
        const totalPaid = approvedPayments.reduce((sum, p) => sum + Number(p.paymentAmount), 0);

        const schedules = await this.scheduleRepo.find({
          where: { contract: { id: sc.id } },
        });
        const totalPenalty = schedules.reduce((sum, s) => sum + Number(s.penaltyAmount), 0);

        results.push({
          customer_id: customerId,
          contract_id: sc.id,
          contract_number: sc.contractNo,
          property_price: Number(sc.contractAmount),
          total_paid: totalPaid,
          total_penalty: totalPenalty,
          outstanding_balance: Number(sc.contractAmount) + totalPenalty - totalPaid,
        });
      }
      return results;
    }
  }

  async getAgingAnalysis(): Promise<any> {
    const today = new Date();
    const schedules = await this.scheduleRepo.find({
      where: [
        { status: 'PENDING' },
        { status: 'PARTIAL' },
        { status: 'OVERDUE' },
      ],
      relations: { contract: { customer: true } },
    });

    const aging = {
      current: 0,
      days30: 0,
      days60: 0,
      days90: 0,
      days90Plus: 0,
    };

    for (const s of schedules) {
      const outstanding = Number(s.outstandingAmount || 0);
      if (outstanding <= 0) continue;

      const due = new Date(s.dueDate);
      if (today <= due) {
        aging.current += outstanding;
      } else {
        const diffMs = today.getTime() - due.getTime();
        const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

        if (diffDays <= 30) aging.days30 += outstanding;
        else if (diffDays <= 60) aging.days60 += outstanding;
        else if (diffDays <= 90) aging.days90 += outstanding;
        else aging.days90Plus += outstanding;
      }
    }

    return aging;
  }

  async getRevenueSummary(): Promise<any> {
    const payments = await this.paymentRepo.find({ where: { status: 'APPROVED' } });
    const schedules = await this.scheduleRepo.find();

    const totalPaid = payments.reduce((sum, p) => sum + Number(p.paymentAmount), 0);
    const totalPenalty = schedules.reduce((sum, s) => sum + Number(s.penaltyAmount), 0);
    const totalOutstanding = schedules.reduce((sum, s) => sum + Number(s.outstandingAmount), 0);

    return {
      totalCollections: totalPaid,
      totalPenalties: totalPenalty,
      totalRevenue: totalPaid + totalPenalty,
      totalOutstanding: totalOutstanding,
    };
  }

  // --- Payment Reminders Configurations & Mock logs ---
  async getReminderConfigs(): Promise<ReminderConfiguration[]> {
    return this.reminderConfigRepo.find();
  }

  async updateReminderConfig(dto: CreateReminderConfigDto): Promise<ReminderConfiguration> {
    let config = await this.reminderConfigRepo.findOne({ where: { isActive: true } });
    if (!config) {
      config = this.reminderConfigRepo.create({ isActive: true });
    }
    if (dto.reminderDaysBeforeDue !== undefined) config.reminderDaysBeforeDue = dto.reminderDaysBeforeDue;
    if (dto.reminderDaysAfterDue !== undefined) config.reminderDaysAfterDue = dto.reminderDaysAfterDue;
    if (dto.smsEnabled !== undefined) config.smsEnabled = dto.smsEnabled;
    if (dto.emailEnabled !== undefined) config.emailEnabled = dto.emailEnabled;
    if (dto.telegramEnabled !== undefined) config.telegramEnabled = dto.telegramEnabled;
    if (dto.isActive !== undefined) config.isActive = dto.isActive;

    return this.reminderConfigRepo.save(config);
  }

  async getReminderLogs(): Promise<PaymentReminder[]> {
    return this.reminderRepo.find({ relations: { customer: true, contract: true, installment: true } });
  }

  async triggerReminderEngine(): Promise<any> {
    const today = new Date();
    const config = await this.reminderConfigRepo.findOne({ where: { isActive: true } });
    if (!config) return { success: true, reminderCount: 0, remarks: 'Reminders disabled or not configured.' };

    const schedules = await this.scheduleRepo.find({
      where: [
        { status: 'PENDING' },
        { status: 'PARTIAL' },
        { status: 'OVERDUE' },
      ],
      relations: { contract: { customer: true } },
    });

    let count = 0;

    for (const schedule of schedules) {
      const due = new Date(schedule.dueDate);
      const daysDiff = Math.ceil((due.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));

      // Trigger before due date
      if (daysDiff > 0 && daysDiff <= (config.reminderDaysBeforeDue || 5)) {
        const message = `Hello ${schedule.contract.customer.fullName}, your installment #${schedule.installmentNo} for contract ${schedule.contract.contractNo} of ETB ${Number(schedule.outstandingAmount).toLocaleString()} is due on ${due.toLocaleDateString()}. Please process payment.`;
        
        const reminder = this.reminderRepo.create({
          contract: schedule.contract,
          installment: schedule,
          customer: schedule.contract.customer,
          notificationType: config.smsEnabled ? 'SMS' : 'EMAIL',
          reminderDate: today,
          deliveryStatus: 'SENT',
          messageContent: message,
        });
        await this.reminderRepo.save(reminder);
        count++;
      }

      // Trigger after due date (Overdue warning escalation)
      if (daysDiff < 0 && Math.abs(daysDiff) >= (config.reminderDaysAfterDue || 3)) {
        const message = `URGENT: Hello ${schedule.contract.customer.fullName}, your installment #${schedule.installmentNo} for contract ${schedule.contract.contractNo} of ETB ${Number(schedule.outstandingAmount).toLocaleString()} was due on ${due.toLocaleDateString()} and is now OVERDUE. Please resolve this immediately.`;
        
        const reminder = this.reminderRepo.create({
          contract: schedule.contract,
          installment: schedule,
          customer: schedule.contract.customer,
          notificationType: config.telegramEnabled ? 'TELEGRAM' : 'SMS',
          reminderDate: today,
          deliveryStatus: 'SENT',
          messageContent: message,
        });
        await this.reminderRepo.save(reminder);
        count++;
      }
    }

    return {
      success: true,
      reminderCount: count,
      remarks: `Reminder scan completed. Issued ${count} mock customer reminders.`,
    };
  }}
