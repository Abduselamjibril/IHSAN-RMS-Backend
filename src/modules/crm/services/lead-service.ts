import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import * as ExcelJS from 'exceljs';
import { Lead } from '../entities/lead.entity';
import { LeadSource } from '../entities/lead-source.entity';
import { LeadStatus } from '../entities/lead-status.entity';
import { SalesAgent } from '../entities/sales-agent.entity';
import { LeadActivity } from '../entities/lead-activity.entity';
import { LeadNote } from '../entities/lead-note.entity';
import { LeadContact } from '../entities/lead-contact.entity';
import { Communication } from '../entities/communication.entity';
import { CommunicationAttachment } from '../entities/communication-attachment.entity';
import { CommunicationAudit } from '../entities/communication-audit.entity';
import { Opportunity } from '../entities/opportunity.entity';
import { CustomerTag } from '../entities/customer-tag.entity';
import { NotificationService } from './notification.service';
import { DocumentService } from './document.service';
import { SegmentationService } from './segmentation.service';
import { CreateLeadDto } from '../dto/create-lead.dto';
import { UpdateLeadDto } from '../dto/update-lead.dto';
import { AddActivityDto } from '../dto/add-activity.dto';
export function parseDatePreservingLocal(dateVal: any): Date {
  if (!dateVal) return new Date();
  if (dateVal instanceof Date) return dateVal;
  const str = String(dateVal).trim();
  if (str.includes('T')) {
    const [datePart, timeWithOffset] = str.split('T');
    const timePart = timeWithOffset.split('Z')[0].split('+')[0];
    const [year, month, day] = datePart.split('-').map(Number);
    const timeParts = timePart.split(':').map(Number);
    return new Date(Date.UTC(year, month - 1, day, timeParts[0] || 0, timeParts[1] || 0, timeParts[2] || 0));
  }
  return new Date(dateVal);
}

@Injectable()
export class LeadService {
  constructor(
    @InjectRepository(Lead)
    private readonly leadRepo: Repository<Lead>,
    @InjectRepository(LeadSource)
    private readonly leadSourceRepo: Repository<LeadSource>,
    @InjectRepository(LeadStatus)
    private readonly leadStatusRepo: Repository<LeadStatus>,
    @InjectRepository(SalesAgent)
    private readonly salesAgentRepo: Repository<SalesAgent>,
    @InjectRepository(LeadActivity)
    private readonly leadActivityRepo: Repository<LeadActivity>,
    @InjectRepository(LeadNote)
    private readonly leadNoteRepo: Repository<LeadNote>,
    @InjectRepository(LeadContact)
    private readonly leadContactRepo: Repository<LeadContact>,
    @InjectRepository(Communication)
    private readonly communicationRepo: Repository<Communication>,
    @InjectRepository(CommunicationAttachment)
    private readonly attachmentRepo: Repository<CommunicationAttachment>,
    @InjectRepository(CommunicationAudit)
    private readonly commAuditRepo: Repository<CommunicationAudit>,
    @InjectRepository(Opportunity)
    private readonly opportunityRepo: Repository<Opportunity>,
    @InjectRepository(CustomerTag)
    private readonly tagRepo: Repository<CustomerTag>,
    private readonly notificationService: NotificationService,
    private readonly documentService: DocumentService,
    private readonly segmentationService: SegmentationService,
  ) { }

  async create(createLeadDto: CreateLeadDto): Promise<Lead> {
    if (!createLeadDto.fullName || !createLeadDto.fullName.trim()) {
      throw new BadRequestException('Full Name is required');
    }
    if (!createLeadDto.primaryPhone || !createLeadDto.primaryPhone.trim()) {
      throw new BadRequestException('Phone number is required');
    }
    if (!createLeadDto.leadSourceId || +createLeadDto.leadSourceId === 0) {
      throw new BadRequestException('Lead Source is required');
    }
    if (!createLeadDto.interestedPropertyType || !createLeadDto.interestedPropertyType.trim()) {
      throw new BadRequestException('Interested Project is required');
    }

    // Email format validation
    const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
    if (createLeadDto.primaryEmail && !emailRegex.test(createLeadDto.primaryEmail.trim())) {
      throw new BadRequestException('Invalid primary email format');
    }
    if (createLeadDto.secondaryEmail && !emailRegex.test(createLeadDto.secondaryEmail.trim())) {
      throw new BadRequestException('Invalid secondary email format');
    }

    // Budget range validation
    if (
      createLeadDto.budgetMin !== undefined &&
      createLeadDto.budgetMin !== null &&
      createLeadDto.budgetMax !== undefined &&
      createLeadDto.budgetMax !== null &&
      +createLeadDto.budgetMax < +createLeadDto.budgetMin
    ) {
      throw new BadRequestException('Budget Max must be greater than or equal to Budget Min.');
    }

    const lead = new Lead();
    lead.fullName = createLeadDto.fullName.trim();
    lead.gender = createLeadDto.gender as any;
    lead.primaryPhone = createLeadDto.primaryPhone.trim();
    lead.secondaryPhone = createLeadDto.secondaryPhone as any;
    lead.primaryEmail = createLeadDto.primaryEmail as any;
    lead.secondaryEmail = createLeadDto.secondaryEmail as any;
    lead.nationality = createLeadDto.nationality as any;
    lead.city = createLeadDto.city as any;
    lead.country = createLeadDto.country as any;
    lead.preferredContactMethod = createLeadDto.preferredContactMethod as any;
    lead.budgetMin = createLeadDto.budgetMin as any;
    lead.budgetMax = createLeadDto.budgetMax as any;
    lead.interestedPropertyType = createLeadDto.interestedPropertyType as any;
    lead.remarks = createLeadDto.remarks as any;

    // Generate unique code: LD + YYMMDD + 4 random digits
    const dateStr = new Date().toISOString().slice(2, 10).replace(/-/g, '');
    const randStr = Math.floor(1000 + Math.random() * 9000).toString();
    lead.leadCode = `LD-${dateStr}-${randStr}`;

    // 1. Resolve Lead Source
    if (createLeadDto.leadSourceId) {
      const source = await this.leadSourceRepo.findOne({ where: { id: createLeadDto.leadSourceId } });
      if (source) lead.leadSource = source;
    }

    // 2. Resolve Lead Status (Default to "New" if not specified)
    if (createLeadDto.leadStatusId) {
      const status = await this.leadStatusRepo.findOne({ where: { id: createLeadDto.leadStatusId } });
      if (status) lead.leadStatus = status;
    } else {
      const defaultStatus = await this.leadStatusRepo.findOne({ where: { statusName: 'New' } });
      if (defaultStatus) lead.leadStatus = defaultStatus;
    }

    // 3. Resolve Assigned Sales Agent
    if (createLeadDto.assignedSalesAgentId) {
      const agent = await this.salesAgentRepo.findOne({ where: { id: createLeadDto.assignedSalesAgentId } });
      if (agent) lead.assignedSalesAgent = agent;
    }

    // 4. Duplicate Detection (checks phone number or email)
    const existing = await this.leadRepo.findOne({
      where: [
        { primaryPhone: lead.primaryPhone, isDeleted: false },
        lead.primaryEmail ? { primaryEmail: lead.primaryEmail, isDeleted: false } : null,
      ].filter(Boolean) as any,
    });

    if (existing) {
      lead.isDuplicate = true;
      lead.duplicateOfLead = existing;
    }

    // Save lead
    const savedLead = await this.leadRepo.save(lead);

    // Save multi-contacts if provided
    if (createLeadDto.contacts && createLeadDto.contacts.length > 0) {
      for (const c of createLeadDto.contacts) {
        const contact = new LeadContact();
        contact.lead = savedLead;
        contact.contactName = c.contactName;
        contact.relationshipType = c.relationshipType;
        contact.phone = c.phone || '';
        contact.email = c.email || '';
        contact.isPrimary = !!c.isPrimary;
        contact.notes = c.notes || '';
        await this.leadContactRepo.save(contact);
      }
    }

    // Write note if provided
    if (createLeadDto.remarks) {
      const note = new LeadNote();
      note.lead = savedLead;
      note.note = createLeadDto.remarks;
      note.isInternal = true;
      await this.leadNoteRepo.save(note);
    }

    // Log Activity: Lead Created
    const act = new LeadActivity();
    act.lead = savedLead;
    act.activityType = 'System';
    act.activityDate = new Date();
    act.subject = 'Lead Registered';
    act.description = lead.isDuplicate
      ? `Lead registered successfully (Flagged as duplicate of ${existing?.fullName || 'another lead'})`
      : 'Lead registered successfully in the system.';
    await this.leadActivityRepo.save(act);

    // Trigger assignment notification if sales agent is assigned during creation
    if (lead.assignedSalesAgent) {
      await this.notificationService.triggerAssignmentNotification(savedLead, lead.assignedSalesAgent);
    }

    // Auto-recalculate segments asynchronously
    this.segmentationService.recalculateAllSegments().catch(err => {
      console.error('[AUTO-SEGMENTATION] Error recalculating segments on lead creation:', err);
    });

    return savedLead;
  }

  async findAll(query: any): Promise<{ data: Lead[]; total: number; page: number; limit: number }> {
    const page = parseInt(query.page) || 1;
    const limit = parseInt(query.limit) || 10;
    const skip = (page - 1) * limit;

    const queryBuilder = this.leadRepo.createQueryBuilder('lead')
      .leftJoinAndSelect('lead.leadSource', 'leadSource')
      .leftJoinAndSelect('lead.leadStatus', 'leadStatus')
      .leftJoinAndSelect('lead.assignedSalesAgent', 'assignedSalesAgent')
      .leftJoinAndSelect('lead.tags', 'tags')
      .where('lead.isDeleted = :isDeleted', { isDeleted: false });

    // Filter by search string
    if (query.search) {
      queryBuilder.andWhere(
        '(lead.fullName ILIKE :search OR lead.primaryPhone ILIKE :search OR lead.primaryEmail ILIKE :search OR lead.leadCode ILIKE :search OR lead.interestedPropertyType ILIKE :search OR lead.city ILIKE :search)',
        { search: `%${query.search}%` }
      );
    }

    // Filter by status
    if (query.statusId) {
      queryBuilder.andWhere('lead.leadStatus = :statusId', { statusId: query.statusId });
    }

    // Filter by source
    if (query.sourceId) {
      queryBuilder.andWhere('lead.leadSource = :sourceId', { sourceId: query.sourceId });
    }

    // Filter by agent
    if (query.agentId) {
      queryBuilder.andWhere('lead.assignedSalesAgent = :agentId', { agentId: query.agentId });
    }

    // Filter by project
    if (query.project) {
      queryBuilder.andWhere(
        '(lead.interestedPropertyType ILIKE :project OR lead.city ILIKE :project OR lead.remarks ILIKE :project)',
        { project: `%${query.project}%` }
      );
    }

    // Filter by budget
    if (query.budgetMin) {
      queryBuilder.andWhere('lead.budgetMax >= :budgetMin', { budgetMin: query.budgetMin });
    }
    if (query.budgetMax) {
      queryBuilder.andWhere('lead.budgetMin <= :budgetMax', { budgetMax: query.budgetMax });
    }

    // Filter by date range
    if (query.dateFrom) {
      queryBuilder.andWhere('lead.createdAt >= :dateFrom', { dateFrom: new Date(query.dateFrom) });
    }
    if (query.dateTo) {
      const endOfDay = new Date(query.dateTo);
      endOfDay.setHours(23, 59, 59, 999);
      queryBuilder.andWhere('lead.createdAt <= :dateTo', { dateTo: endOfDay });
    }

    queryBuilder
      .orderBy('lead.createdAt', 'DESC')
      .skip(skip)
      .take(limit);

    const [data, total] = await queryBuilder.getManyAndCount();

    return {
      data,
      total,
      page,
      limit,
    };
  }

  async findOne(id: number): Promise<any> {
    const lead = await this.leadRepo.findOne({
      where: { id, isDeleted: false },
      relations: {
        leadSource: true,
        leadStatus: true,
        assignedSalesAgent: true,
        duplicateOfLead: true,
        tags: true,
      },
    });

    if (!lead) {
      throw new NotFoundException(`Lead with ID ${id} not found`);
    }

    const opportunity = await this.opportunityRepo.findOne({
      where: { lead: { id: lead.id }, isDeleted: false },
      relations: { opportunityStage: true },
    });

    // Fetch activities, notes, and contacts
    const activities = await this.leadActivityRepo.find({
      where: { lead: { id } },
      order: { activityDate: 'DESC' },
    });

    const notes = await this.leadNoteRepo.find({
      where: { lead: { id } },
      order: { createdAt: 'DESC' },
    });

    const contacts = await this.leadContactRepo.find({
      where: { lead: { id }, isDeleted: false },
      order: { id: 'ASC' },
    });

    return {
      ...lead,
      opportunity,
      activities,
      notes,
      contacts,
    };
  }

  async getContacts(leadId: number): Promise<LeadContact[]> {
    return this.leadContactRepo.find({
      where: { lead: { id: leadId }, isDeleted: false },
      order: { id: 'ASC' },
    });
  }

  async addContact(leadId: number, data: any): Promise<LeadContact> {
    const lead = await this.leadRepo.findOne({ where: { id: leadId, isDeleted: false } });
    if (!lead) {
      throw new NotFoundException(`Lead with ID ${leadId} not found`);
    }

    const contact = new LeadContact();
    contact.lead = lead;
    contact.contactName = data.contactName;
    contact.relationshipType = data.relationshipType;
    contact.phone = data.phone || '';
    contact.email = data.email || '';
    contact.isPrimary = !!data.isPrimary;
    contact.notes = data.notes || '';

    return this.leadContactRepo.save(contact);
  }

  async addAttachment(leadId: number, file: any): Promise<CommunicationAttachment> {
    const lead = await this.leadRepo.findOne({ where: { id: leadId, isDeleted: false } });
    if (!lead) {
      throw new NotFoundException(`Lead with ID ${leadId} not found`);
    }

    // 1. Create a Communication record
    const comm = new Communication();
    comm.lead = lead;
    comm.subject = `File Attachment`;
    comm.messageBody = `Uploaded file: ${file.originalname}`;
    comm.communicationStatus = 'Completed';
    comm.communicationDatetime = new Date();
    const savedComm = await this.communicationRepo.save(comm);

    // 2. Create the CommunicationAttachment record
    const attach = new CommunicationAttachment();
    attach.communication = savedComm;
    attach.fileName = file.originalname;
    attach.filePath = `/uploads/${file.filename}`;
    attach.fileSize = file.size;
    attach.mimeType = file.mimetype;
    const savedAttach = await this.attachmentRepo.save(attach);

    // 3. Log a LeadActivity
    const act = new LeadActivity();
    act.lead = lead;
    act.activityType = 'System';
    act.activityDate = new Date();
    act.subject = 'File Attached';
    act.description = `Attached file: ${file.originalname}`;
    await this.leadActivityRepo.save(act);

    // 4. Automatically synchronize document to main Customer Document repository
    try {
      await this.documentService.uploadDocument(leadId, file, { category: 'ID', accessRole: 'Sales' });
    } catch (err) {
      console.error('[DOCUMENT SYNC ERROR] Failed to sync attachment to main document module:', err);
    }

    return savedAttach;
  }

  async getAttachments(leadId: number): Promise<CommunicationAttachment[]> {
    return this.attachmentRepo.find({
      where: { communication: { lead: { id: leadId } } },
      relations: { communication: true },
      order: { id: 'DESC' },
    });
  }

  async update(id: number, updateLeadDto: UpdateLeadDto): Promise<Lead> {
    const lead = await this.leadRepo.findOne({
      where: { id, isDeleted: false },
      relations: { leadSource: true, leadStatus: true, assignedSalesAgent: true },
    });
    if (!lead) {
      throw new NotFoundException(`Lead with ID ${id} not found`);
    }

    const previousStatusId = lead.leadStatus?.id;
    const previousAgentId = lead.assignedSalesAgent?.id;

    if (updateLeadDto.fullName !== undefined) lead.fullName = updateLeadDto.fullName;
    if (updateLeadDto.gender !== undefined) lead.gender = updateLeadDto.gender as any;
    if (updateLeadDto.primaryPhone !== undefined) lead.primaryPhone = updateLeadDto.primaryPhone;
    if (updateLeadDto.secondaryPhone !== undefined) lead.secondaryPhone = updateLeadDto.secondaryPhone as any;
    if (updateLeadDto.primaryEmail !== undefined) lead.primaryEmail = updateLeadDto.primaryEmail as any;
    if (updateLeadDto.secondaryEmail !== undefined) lead.secondaryEmail = updateLeadDto.secondaryEmail as any;
    if (updateLeadDto.nationality !== undefined) lead.nationality = updateLeadDto.nationality as any;
    if (updateLeadDto.city !== undefined) lead.city = updateLeadDto.city as any;
    if (updateLeadDto.country !== undefined) lead.country = updateLeadDto.country as any;
    if (updateLeadDto.preferredContactMethod !== undefined) lead.preferredContactMethod = updateLeadDto.preferredContactMethod as any;
    if (updateLeadDto.budgetMin !== undefined) lead.budgetMin = updateLeadDto.budgetMin as any;
    if (updateLeadDto.budgetMax !== undefined) lead.budgetMax = updateLeadDto.budgetMax as any;
    if (updateLeadDto.interestedPropertyType !== undefined) lead.interestedPropertyType = updateLeadDto.interestedPropertyType as any;
    if (updateLeadDto.remarks !== undefined) lead.remarks = updateLeadDto.remarks as any;

    // Resolve Source
    if (updateLeadDto.leadSourceId !== undefined) {
      if (updateLeadDto.leadSourceId === null) {
        lead.leadSource = null as any;
      } else {
        const source = await this.leadSourceRepo.findOne({ where: { id: updateLeadDto.leadSourceId } });
        if (source) lead.leadSource = source;
      }
    }

    // Resolve Status
    if (updateLeadDto.leadStatusId !== undefined) {
      if (updateLeadDto.leadStatusId === null) {
        lead.leadStatus = null as any;
      } else {
        const status = await this.leadStatusRepo.findOne({ where: { id: updateLeadDto.leadStatusId } });
        if (status) lead.leadStatus = status;
      }
    }

    // Resolve Agent
    if (updateLeadDto.assignedSalesAgentId !== undefined) {
      if (updateLeadDto.assignedSalesAgentId === null) {
        lead.assignedSalesAgent = null as any;
      } else {
        const agent = await this.salesAgentRepo.findOne({ where: { id: updateLeadDto.assignedSalesAgentId } });
        if (agent) lead.assignedSalesAgent = agent;
      }
    }

    // Resolve Tags
    if ((updateLeadDto as any).tags !== undefined) {
      const tagInput = (updateLeadDto as any).tags;
      const tagNames: string[] = Array.isArray(tagInput)
        ? tagInput.map(t => typeof t === 'string' ? t.trim() : (t?.tagName || String(t))).filter(Boolean)
        : [];
      
      const tagEntities: CustomerTag[] = [];
      for (const name of tagNames) {
        let tag = await this.tagRepo.findOne({ where: { tagName: name } });
        if (!tag) {
          tag = new CustomerTag();
          tag.tagName = name;
          tag.colorCode = '#4338ca';
          tag = await this.tagRepo.save(tag);
        }
        tagEntities.push(tag);
      }
      lead.tags = tagEntities;
    }

    const savedLead = await this.leadRepo.save(lead);

    // Log status transition activity if changed
    if (updateLeadDto.leadStatusId && updateLeadDto.leadStatusId !== previousStatusId) {
      const status = await this.leadStatusRepo.findOne({ where: { id: updateLeadDto.leadStatusId } });
      if (status) {
        const act = new LeadActivity();
        act.lead = savedLead;
        act.activityType = 'StatusChange';
        act.activityDate = new Date();
        act.subject = 'Lead Status Updated';
        act.description = `Status changed to: ${status.statusName}`;
        await this.leadActivityRepo.save(act);
      }
    }

    // Log assignment activity if agent changed
    if (updateLeadDto.assignedSalesAgentId && updateLeadDto.assignedSalesAgentId !== previousAgentId) {
      const agent = await this.salesAgentRepo.findOne({ where: { id: updateLeadDto.assignedSalesAgentId } });
      if (agent) {
        const act = new LeadActivity();
        act.lead = savedLead;
        act.activityType = 'Assignment';
        act.activityDate = new Date();
        act.subject = 'Lead Sales Agent Assigned';
        act.description = `Lead assigned to sales agent: ${agent.fullName}`;
        await this.leadActivityRepo.save(act);
      }
    }

    // Auto-recalculate segments asynchronously
    this.segmentationService.recalculateAllSegments().catch(err => {
      console.error('[AUTO-SEGMENTATION] Error recalculating segments on lead update:', err);
    });

    return savedLead;
  }

  async assignAgent(id: number, agentId: number, performedBy: string = 'Admin User'): Promise<Lead> {
    const lead = await this.leadRepo.findOne({ where: { id, isDeleted: false } });
    if (!lead) {
      throw new NotFoundException(`Lead with ID ${id} not found`);
    }

    const agent = await this.salesAgentRepo.findOne({ where: { id: agentId } });
    if (!agent) {
      throw new NotFoundException(`Sales Agent with ID ${agentId} not found`);
    }

    lead.assignedSalesAgent = agent;
    const savedLead = await this.leadRepo.save(lead);

    const act = new LeadActivity();
    act.lead = savedLead;
    act.activityType = 'Assignment';
    act.activityDate = new Date();
    act.subject = 'Agent Assigned';
    act.description = `Lead assigned to: ${agent.fullName} (Assigned by: ${performedBy})`;
    await this.leadActivityRepo.save(act);

    await this.notificationService.triggerAssignmentNotification(savedLead, agent);

    return savedLead;
  }

  async changeStatus(id: number, statusId: number): Promise<Lead> {
    const lead = await this.leadRepo.findOne({
      where: { id, isDeleted: false },
      relations: { assignedSalesAgent: true }
    });
    if (!lead) {
      throw new NotFoundException(`Lead with ID ${id} not found`);
    }

    const status = await this.leadStatusRepo.findOne({ where: { id: statusId } });
    if (!status) {
      throw new NotFoundException(`Lead Status with ID ${statusId} not found`);
    }

    lead.leadStatus = status;
    const savedLead = await this.leadRepo.save(lead);

    const act = new LeadActivity();
    act.lead = savedLead;
    act.activityType = 'StatusChange';
    act.activityDate = new Date();
    act.subject = 'Status Changed';
    act.description = `Lead status set to: ${status.statusName}`;
    await this.leadActivityRepo.save(act);

    await this.notificationService.triggerStatusNotification(savedLead, status.statusName);

    return savedLead;
  }

  async addActivity(id: number, dto: AddActivityDto): Promise<LeadActivity> {
    const lead = await this.leadRepo.findOne({
      where: { id, isDeleted: false },
      relations: { assignedSalesAgent: true }
    });
    if (!lead) {
      throw new NotFoundException(`Lead with ID ${id} not found`);
    }

    const act = new LeadActivity();
    act.lead = lead;
    act.activityType = dto.activityType || 'Call';
    act.activityDate = dto.activityDate ? parseDatePreservingLocal(dto.activityDate) : new Date();
    act.subject = dto.subject || 'Interaction logged';
    act.description = dto.description as any;
    act.performedBy = dto.performedBy as any;
    act.outcome = dto.outcome as any;

    if (dto.nextActionDate) {
      const followupDate = parseDatePreservingLocal(dto.nextActionDate);
      act.nextActionDate = followupDate;
      lead.nextFollowupAt = followupDate;
    }

    const savedAct = await this.leadActivityRepo.save(act);

    // Save to Communication repository so it appears on unified Communications Timeline & filters (TC-2.16)
    try {
      const comm = new Communication();
      comm.lead = lead;
      comm.subject = dto.subject || `${dto.activityType} logged`;
      comm.messageBody = dto.description as any;
      comm.communicationDatetime = act.activityDate;
      comm.communicationDirection = dto.direction || 'Outbound';
      comm.communicationStatus = dto.activityType || 'Call';
      comm.durationSeconds = dto.durationMinutes ? (dto.durationMinutes * 60) : null as any;
      comm.externalReference = dto.location ? `Location: ${dto.location}` : (dto.attendees ? `Attendees: ${dto.attendees}` : '');
      await this.communicationRepo.save(comm);
    } catch (e) {
      console.error('Error saving communication timeline record:', e);
    }

    // Also update lastContactedAt on the lead
    lead.lastContactedAt = new Date();
    if (dto.nextActionDate && act.nextActionDate) {
      // Also create a FollowupReminder record
      await this.notificationService.createReminder(
        lead,
        lead.assignedSalesAgent,
        act.nextActionDate,
        `Follow-up: ${dto.subject || 'Interaction logged'}`,
        `Scheduled follow-up reminder for lead ${lead.fullName}. Notes: ${dto.description || ''}`
      );
    }
    await this.leadRepo.save(lead);

    return savedAct;
  }

  async exportCsv(query: any): Promise<string> {
    // Fetch matching leads
    const { data } = await this.findAll({ ...query, limit: 10000 });

    const headers = [
      'Lead Code',
      'Full Name',
      'Primary Phone',
      'Primary Email',
      'Preferred Contact',
      'Budget Min',
      'Budget Max',
      'Status',
      'Source',
      'Agent',
      'Duplicate Flag',
      'Created At',
    ];

    const rows = data.map(l => [
      l.leadCode,
      `"${l.fullName.replace(/"/g, '""')}"`,
      l.primaryPhone,
      l.primaryEmail || '',
      l.preferredContactMethod || '',
      l.budgetMin || 0,
      l.budgetMax || 0,
      l.leadStatus?.statusName || '',
      l.leadSource?.sourceName || '',
      l.assignedSalesAgent?.fullName || '',
      l.isDuplicate ? 'Yes' : 'No',
      l.createdAt.toISOString(),
    ]);

    const csvContent = [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
    return csvContent;
  }

  async exportExcel(query: any): Promise<Buffer> {
    const page = 1;
    const limit = 10000;
    const { data: leads } = await this.findAll({ ...query, page, limit });

    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet('Leads Export');

    worksheet.columns = [
      { header: 'Lead Code', key: 'leadCode', width: 18 },
      { header: 'Full Name', key: 'fullName', width: 25 },
      { header: 'Primary Phone', key: 'primaryPhone', width: 18 },
      { header: 'Secondary Phone', key: 'secondaryPhone', width: 18 },
      { header: 'Primary Email', key: 'primaryEmail', width: 25 },
      { header: 'City', key: 'city', width: 15 },
      { header: 'Country', key: 'country', width: 15 },
      { header: 'Interested Project', key: 'interestedPropertyType', width: 25 },
      { header: 'Budget Min', key: 'budgetMin', width: 15 },
      { header: 'Budget Max', key: 'budgetMax', width: 15 },
      { header: 'Lead Source', key: 'leadSource', width: 18 },
      { header: 'Lead Status', key: 'leadStatus', width: 15 },
      { header: 'Assigned Sales Agent', key: 'assignedAgent', width: 22 },
      { header: 'Created Date', key: 'createdAt', width: 20 },
    ];

    worksheet.getRow(1).font = { bold: true, color: { argb: 'FFFFFF' } };
    worksheet.getRow(1).fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: '0F1B29' },
    };

    for (const lead of leads) {
      worksheet.addRow({
        leadCode: lead.leadCode || '',
        fullName: lead.fullName || '',
        primaryPhone: lead.primaryPhone || '',
        secondaryPhone: lead.secondaryPhone || '',
        primaryEmail: lead.primaryEmail || '',
        city: lead.city || '',
        country: lead.country || '',
        interestedPropertyType: lead.interestedPropertyType || '',
        budgetMin: lead.budgetMin ? Number(lead.budgetMin) : '',
        budgetMax: lead.budgetMax ? Number(lead.budgetMax) : '',
        leadSource: lead.leadSource?.sourceName || '',
        leadStatus: lead.leadStatus?.statusName || '',
        assignedAgent: lead.assignedSalesAgent?.fullName || 'Unassigned',
        createdAt: lead.createdAt ? new Date(lead.createdAt).toISOString().slice(0, 10) : '',
      });
    }

    const buffer = await workbook.xlsx.writeBuffer();
    return Buffer.from(buffer);
  }

  async getStats(): Promise<any> {
    const totalLeads = await this.leadRepo.count({ where: { isDeleted: false } });
    const duplicateLeads = await this.leadRepo.count({ where: { isDeleted: false, isDuplicate: true } });

    // Leads by status
    const statusCounts = await this.leadRepo.createQueryBuilder('lead')
      .leftJoin('lead.leadStatus', 'status')
      .select('status.statusName', 'statusName')
      .addSelect('status.colorCode', 'colorCode')
      .addSelect('COUNT(lead.id)', 'count')
      .where('lead.isDeleted = :isDeleted', { isDeleted: false })
      .groupBy('status.id')
      .addGroupBy('status.statusName')
      .addGroupBy('status.colorCode')
      .getRawMany();

    // Leads by source
    const sourceCounts = await this.leadRepo.createQueryBuilder('lead')
      .leftJoin('lead.leadSource', 'source')
      .select('source.sourceName', 'sourceName')
      .addSelect('COUNT(lead.id)', 'count')
      .where('lead.isDeleted = :isDeleted', { isDeleted: false })
      .groupBy('source.id')
      .addGroupBy('source.sourceName')
      .getRawMany();

    // Leads by assigned agent
    const agentCounts = await this.leadRepo.createQueryBuilder('lead')
      .leftJoin('lead.assignedSalesAgent', 'agent')
      .select('agent.fullName', 'agentName')
      .addSelect('COUNT(lead.id)', 'count')
      .where('lead.isDeleted = :isDeleted', { isDeleted: false })
      .andWhere('lead.assignedSalesAgent IS NOT NULL')
      .groupBy('agent.id')
      .addGroupBy('agent.fullName')
      .getRawMany();

    // Opportunities stats
    const totalOpportunities = await this.opportunityRepo.count({
      where: { isDeleted: false },
    });

    const wonOpportunities = await this.opportunityRepo.count({
      where: { isDeleted: false, isWon: true },
    });

    const pipelineResult = await this.opportunityRepo.createQueryBuilder('opp')
      .select('SUM(opp.estimatedValue)', 'sum')
      .where('opp.isDeleted = :isDeleted', { isDeleted: false })
      .andWhere('opp.isWon = :isWon', { isWon: false })
      .andWhere('opp.isLost = :isLost', { isLost: false })
      .getRawOne();

    const pipelineValue = parseFloat(pipelineResult?.sum || '0');

    return {
      totalLeads,
      duplicateLeads,
      totalOpportunities,
      wonOpportunities,
      pipelineValue,
      byStatus: statusCounts.map(s => ({
        status: s.statusName || 'Unassigned',
        color: s.colorCode || '#9ca3af',
        count: parseInt(s.count),
      })),
      bySource: sourceCounts.map(src => ({
        source: src.sourceName || 'Unassigned',
        count: parseInt(src.count),
      })),
      byAgent: agentCounts.map(a => ({
        agent: a.agentName || 'Unassigned',
        count: parseInt(a.count),
      })),
    };
  }

  async addNote(id: number, noteContent: string): Promise<LeadNote> {
    const lead = await this.leadRepo.findOne({ where: { id, isDeleted: false } });
    if (!lead) {
      throw new NotFoundException(`Lead with ID ${id} not found`);
    }
    const note = new LeadNote();
    note.lead = lead;
    note.note = noteContent;
    note.isInternal = true;
    return this.leadNoteRepo.save(note);
  }

  async findAllNotes(query: any): Promise<{ data: LeadNote[]; total: number }> {
    const queryBuilder = this.leadNoteRepo.createQueryBuilder('note')
      .leftJoinAndSelect('note.lead', 'lead')
      .orderBy('note.createdAt', 'DESC');

    if (query.search) {
      queryBuilder.andWhere('(note.note ILIKE :search OR lead.fullName ILIKE :search)', { search: `%${query.search}%` });
    }

    if (query.leadId) {
      queryBuilder.andWhere('lead.id = :leadId', { leadId: +query.leadId });
    }

    const [data, total] = await queryBuilder.getManyAndCount();
    return { data, total };
  }

  async findAllAttachments(query: any): Promise<{ data: CommunicationAttachment[]; total: number }> {
    const queryBuilder = this.attachmentRepo.createQueryBuilder('attachment')
      .leftJoinAndSelect('attachment.communication', 'communication')
      .leftJoinAndSelect('communication.lead', 'lead')
      .orderBy('attachment.uploadedAt', 'DESC');

    if (query.search) {
      queryBuilder.andWhere('(attachment.fileName ILIKE :search OR lead.fullName ILIKE :search)', { search: `%${query.search}%` });
    }

    if (query.leadId) {
      queryBuilder.andWhere('lead.id = :leadId', { leadId: +query.leadId });
    }

    const [data, total] = await queryBuilder.getManyAndCount();
    return { data, total };
  }

  async findAllActivities(query: any): Promise<{ data: LeadActivity[]; total: number }> {
    const queryBuilder = this.leadActivityRepo.createQueryBuilder('activity')
      .leftJoinAndSelect('activity.lead', 'lead')
      .orderBy('activity.activityDate', 'DESC');

    if (query.search) {
      queryBuilder.andWhere('(activity.subject ILIKE :search OR activity.description ILIKE :search OR lead.fullName ILIKE :search)', { search: `%${query.search}%` });
    }

    if (query.leadId) {
      queryBuilder.andWhere('lead.id = :leadId', { leadId: +query.leadId });
    }

    if (query.activityType && query.activityType !== 'all') {
      queryBuilder.andWhere('activity.activityType = :activityType', { activityType: query.activityType });
    }

    const [data, total] = await queryBuilder.getManyAndCount();
    return { data, total };
  }

  async getCommunicationTimeline(query: any): Promise<{ data: Communication[]; total: number }> {
    const queryBuilder = this.communicationRepo.createQueryBuilder('comm')
      .leftJoinAndSelect('comm.lead', 'lead')
      .leftJoinAndSelect('comm.opportunity', 'opportunity')
      .leftJoinAndSelect('comm.communicationChannel', 'channel')
      .orderBy('comm.communicationDatetime', 'DESC')
      .addOrderBy('comm.createdAt', 'DESC');

    if (query.search) {
      queryBuilder.andWhere(
        '(comm.subject ILIKE :search OR comm.messageBody ILIKE :search OR lead.fullName ILIKE :search OR comm.externalReference ILIKE :search)',
        { search: `%${query.search}%` },
      );
    }

    if (query.leadId) {
      queryBuilder.andWhere('lead.id = :leadId', { leadId: +query.leadId });
    }

    if (query.channel && query.channel !== 'all') {
      queryBuilder.andWhere(
        '(comm.communicationStatus ILIKE :channel OR channel.channelName ILIKE :channel OR comm.subject ILIKE :channel)',
        { channel: `%${query.channel}%` },
      );
    }

    if (query.dateFrom) {
      queryBuilder.andWhere('comm.communicationDatetime >= :dateFrom', { dateFrom: new Date(query.dateFrom) });
    }

    if (query.dateTo) {
      const endOfDay = new Date(query.dateTo);
      endOfDay.setHours(23, 59, 59, 999);
      queryBuilder.andWhere('comm.communicationDatetime <= :dateTo', { dateTo: endOfDay });
    }

    const [data, total] = await queryBuilder.getManyAndCount();
    return { data, total };
  }

  async editCommunication(id: number, data: any, userId: number = 1): Promise<Communication> {
    const comm = await this.communicationRepo.findOne({
      where: { id },
      relations: { lead: true, opportunity: true, communicationChannel: true },
    });
    if (!comm) {
      throw new NotFoundException(`Communication record with ID ${id} not found`);
    }

    const oldValue = {
      subject: comm.subject,
      messageBody: comm.messageBody,
      communicationDirection: comm.communicationDirection,
      durationSeconds: comm.durationSeconds,
      externalReference: comm.externalReference,
      communicationStatus: comm.communicationStatus,
    };

    if (data.subject !== undefined) comm.subject = data.subject;
    if (data.messageBody !== undefined) comm.messageBody = data.messageBody;
    if (data.communicationDirection !== undefined) comm.communicationDirection = data.communicationDirection;
    if (data.durationSeconds !== undefined) comm.durationSeconds = data.durationSeconds;
    if (data.externalReference !== undefined) comm.externalReference = data.externalReference;
    if (data.communicationStatus !== undefined) comm.communicationStatus = data.communicationStatus;

    const updated = await this.communicationRepo.save(comm);

    const audit = new CommunicationAudit();
    audit.communication = updated;
    audit.auditAction = 'Edit';
    audit.oldValue = oldValue;
    audit.newValue = {
      subject: updated.subject,
      messageBody: updated.messageBody,
      communicationDirection: updated.communicationDirection,
      durationSeconds: updated.durationSeconds,
      externalReference: updated.externalReference,
      communicationStatus: updated.communicationStatus,
    };
    audit.changedBy = userId;
    await this.commAuditRepo.save(audit);

    return updated;
  }

  async getCommunicationAudits(id: number): Promise<CommunicationAudit[]> {
    return this.commAuditRepo.find({
      where: { communication: { id } },
      order: { changedAt: 'DESC' },
    });
  }
}

