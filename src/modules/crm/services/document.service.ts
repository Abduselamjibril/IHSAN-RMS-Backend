import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CustomerDocument } from '../entities/customer-document.entity';
import { CustomerDocumentVersion } from '../entities/customer-document-version.entity';
import { CustomerDocumentAccessLog } from '../entities/customer-document-access-log.entity';
import { Lead } from '../entities/lead.entity';
import { NotificationService } from './notification.service';

@Injectable()
export class DocumentService {
  constructor(
    @InjectRepository(CustomerDocument)
    private readonly documentRepo: Repository<CustomerDocument>,
    @InjectRepository(CustomerDocumentVersion)
    private readonly versionRepo: Repository<CustomerDocumentVersion>,
    @InjectRepository(CustomerDocumentAccessLog)
    private readonly logRepo: Repository<CustomerDocumentAccessLog>,
    @InjectRepository(Lead)
    private readonly leadRepo: Repository<Lead>,
    private readonly notificationService: NotificationService,
  ) {}

  async findAll(query: any): Promise<{ data: CustomerDocument[]; total: number }> {
    const qb = this.documentRepo.createQueryBuilder('doc')
      .leftJoinAndSelect('doc.lead', 'lead')
      .leftJoinAndSelect('doc.versions', 'versions')
      .where('doc.isDeleted = :isDeleted', { isDeleted: false })
      .orderBy('doc.createdAt', 'DESC');

    if (query.leadId && +query.leadId !== 0) {
      qb.andWhere('doc.lead = :leadId', { leadId: +query.leadId });
    }

    if (query.category && query.category !== 'all') {
      qb.andWhere('doc.category = :category', { category: query.category });
    }

    if (query.search) {
      const search = `%${query.search}%`;
      qb.andWhere(
        '(doc.documentCode ILIKE :search OR doc.category ILIKE :search OR lead.fullName ILIKE :search)',
        { search },
      );
    }

    const [data, total] = await qb.getManyAndCount();
    return { data, total };
  }

  async findOne(id: number): Promise<CustomerDocument> {
    const doc = await this.documentRepo.findOne({
      where: { id, isDeleted: false },
      relations: { lead: { assignedSalesAgent: true }, versions: true },
    });
    if (!doc) {
      throw new NotFoundException(`Customer Document with ID ${id} not found`);
    }
    return doc;
  }

  async uploadDocument(
    leadId: number,
    file: any,
    dto: { category: string; expiryDate?: string; accessRole?: string },
  ): Promise<CustomerDocument> {
    const lead = await this.leadRepo.findOne({ where: { id: leadId, isDeleted: false } });
    if (!lead) {
      throw new NotFoundException(`Lead with ID ${leadId} not found`);
    }

    // Generate Document Code (DOC + YYMMDD + 4 random digits)
    const dateStr = new Date().toISOString().slice(2, 10).replace(/-/g, '');
    const randStr = Math.floor(1000 + Math.random() * 9000).toString();
    const documentCode = `DOC-${dateStr}-${randStr}`;

    // Create main document entry
    const doc = new CustomerDocument();
    doc.lead = lead;
    doc.documentCode = documentCode;
    doc.category = dto.category || 'ID';
    doc.expiryDate = dto.expiryDate ? new Date(dto.expiryDate) : null;
    doc.accessRole = dto.accessRole || 'Sales';
    doc.isExpired = false;

    const savedDoc = await this.documentRepo.save(doc);

    // Create the first version
    const version = new CustomerDocumentVersion();
    version.document = savedDoc;
    version.versionNumber = 1;
    version.fileName = file.originalname;
    version.filePath = `/uploads/${file.filename}`;
    version.fileSize = file.size;
    version.mimeType = file.mimetype;
    version.uploadedBy = 1;
    await this.versionRepo.save(version);

    // Audit log
    await this.logAccess(savedDoc.id, 'Upload', 1);

    return this.findOne(savedDoc.id);
  }

  async addVersion(id: number, file: any): Promise<CustomerDocument> {
    const doc = await this.findOne(id);

    // Get current max version number
    const maxVersion = doc.versions.reduce((max, v) => (v.versionNumber > max ? v.versionNumber : max), 0);

    const version = new CustomerDocumentVersion();
    version.document = doc;
    version.versionNumber = maxVersion + 1;
    version.fileName = file.originalname;
    version.filePath = `/uploads/${file.filename}`;
    version.fileSize = file.size;
    version.mimeType = file.mimetype;
    version.uploadedBy = 1;
    await this.versionRepo.save(version);

    // Audit log
    await this.logAccess(doc.id, 'Replace', 1);

    return this.findOne(doc.id);
  }

  async getVersions(id: number): Promise<CustomerDocumentVersion[]> {
    return this.versionRepo.find({
      where: { document: { id } },
      order: { versionNumber: 'DESC' },
    });
  }

  async logAccess(docId: number, action: string, performedBy: number): Promise<CustomerDocumentAccessLog> {
    const log = new CustomerDocumentAccessLog();
    log.document = { id: docId } as any;
    log.action = action;
    log.performedBy = performedBy;
    return this.logRepo.save(log);
  }

  async getAccessLogs(docId: number): Promise<CustomerDocumentAccessLog[]> {
    return this.logRepo.find({
      where: { document: { id: docId } },
      order: { accessedAt: 'DESC' },
    });
  }

  async checkExpiry(): Promise<{ expiredCount: number; warningCount: number }> {
    const now = new Date();
    const todayStr = now.toISOString().slice(0, 10);

    // 1. Check for newly expired documents
    const expiredDocs = await this.documentRepo.createQueryBuilder('doc')
      .leftJoinAndSelect('doc.lead', 'lead')
      .leftJoinAndSelect('lead.assignedSalesAgent', 'agent')
      .where('doc.isDeleted = :isDeleted', { isDeleted: false })
      .andWhere('doc.isExpired = :isExpired', { isExpired: false })
      .andWhere('doc.expiryDate <= :today', { today: todayStr })
      .getMany();

    let expiredCount = 0;
    for (const doc of expiredDocs) {
      doc.isExpired = true;
      await this.documentRepo.save(doc);

      // Trigger reminder
      await this.notificationService.createReminder(
        doc.lead,
        doc.lead.assignedSalesAgent,
        new Date(),
        `Document Expired: ${doc.category}`,
        `Document of category "${doc.category}" (Code: ${doc.documentCode}) for lead ${doc.lead?.fullName || 'N/A'} has expired. Expiry date was ${new Date(doc.expiryDate!).toLocaleDateString()}.`
      );
      expiredCount++;
    }

    // 2. Check for documents expiring in 30 days
    const thirtyDaysFromNow = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);
    const thirtyDaysStr = thirtyDaysFromNow.toISOString().slice(0, 10);

    const warningDocs = await this.documentRepo.createQueryBuilder('doc')
      .leftJoinAndSelect('doc.lead', 'lead')
      .leftJoinAndSelect('lead.assignedSalesAgent', 'agent')
      .where('doc.isDeleted = :isDeleted', { isDeleted: false })
      .andWhere('doc.isExpired = :isExpired', { isExpired: false })
      .andWhere('doc.expiryDate > :today', { today: todayStr })
      .andWhere('doc.expiryDate <= :cutoff', { cutoff: thirtyDaysStr })
      .getMany();

    let warningCount = 0;
    for (const doc of warningDocs) {
      // Trigger warning reminder
      await this.notificationService.createReminder(
        doc.lead,
        doc.lead.assignedSalesAgent,
        new Date(),
        `Document Expiring Soon: ${doc.category}`,
        `Document of category "${doc.category}" (Code: ${doc.documentCode}) for lead ${doc.lead?.fullName || 'N/A'} will expire on ${new Date(doc.expiryDate!).toLocaleDateString()}.`
      );
      warningCount++;
    }

    return { expiredCount, warningCount };
  }
}
