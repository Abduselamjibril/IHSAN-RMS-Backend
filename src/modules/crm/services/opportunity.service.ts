import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Opportunity } from '../entities/opportunity.entity';
import { OpportunityStage } from '../entities/opportunity-stage.entity';
import { OpportunityLossReason } from '../entities/opportunity-loss-reason.entity';
import { OpportunityActivity } from '../entities/opportunity-activity.entity';
import { OpportunityNote } from '../entities/opportunity-note.entity';
import { Lead } from '../entities/lead.entity';
import { LeadStatus } from '../entities/lead-status.entity';
import { LeadActivity } from '../entities/lead-activity.entity';
import { SalesAgent } from '../entities/sales-agent.entity';

@Injectable()
export class OpportunityService {
  constructor(
    @InjectRepository(Opportunity)
    private readonly opportunityRepo: Repository<Opportunity>,
    @InjectRepository(OpportunityStage)
    private readonly stageRepo: Repository<OpportunityStage>,
    @InjectRepository(OpportunityLossReason)
    private readonly lossReasonRepo: Repository<OpportunityLossReason>,
    @InjectRepository(OpportunityActivity)
    private readonly activityRepo: Repository<OpportunityActivity>,
    @InjectRepository(OpportunityNote)
    private readonly noteRepo: Repository<OpportunityNote>,
    @InjectRepository(Lead)
    private readonly leadRepo: Repository<Lead>,
    @InjectRepository(LeadStatus)
    private readonly leadStatusRepo: Repository<LeadStatus>,
    @InjectRepository(LeadActivity)
    private readonly leadActivityRepo: Repository<LeadActivity>,
    @InjectRepository(SalesAgent)
    private readonly agentRepo: Repository<SalesAgent>,
  ) {}

  async convertLeadToOpportunity(
    leadId: number,
    dto: { title: string; estimatedValue: number; expectedCloseDate: string; remarks?: string },
  ): Promise<Opportunity> {
    // 1. Fetch Lead
    const lead = await this.leadRepo.findOne({
      where: { id: leadId, isDeleted: false },
      relations: { assignedSalesAgent: true },
    });
    if (!lead) {
      throw new NotFoundException(`Lead with ID ${leadId} not found`);
    }

    // 2. Set Lead Status to Converted
    let convertedStatus = await this.leadStatusRepo.findOne({
      where: { isConverted: true },
    });
    if (!convertedStatus) {
      convertedStatus = await this.leadStatusRepo.findOne({
        where: { statusName: 'Converted' },
      });
    }
    if (convertedStatus) {
      lead.leadStatus = convertedStatus;
      await this.leadRepo.save(lead);
    }

    // 3. Create conversion audit log for Lead
    const leadAct = new LeadActivity();
    leadAct.lead = lead;
    leadAct.activityType = 'System';
    leadAct.activityDate = new Date();
    leadAct.subject = 'Converted to Opportunity';
    leadAct.description = `Lead successfully converted to an Opportunity: ${dto.title}`;
    await this.leadActivityRepo.save(leadAct);

    // 4. Resolve initial Stage (Qualification)
    let initialStage = await this.stageRepo.findOne({
      where: { sortOrder: 1 },
    });
    if (!initialStage) {
      initialStage = await this.stageRepo.findOne({
        where: { stageName: 'Qualification' },
      });
    }

    // 5. Build Opportunity Code (OPP + YYMMDD + 4 random digits)
    const dateStr = new Date().toISOString().slice(2, 10).replace(/-/g, '');
    const randStr = Math.floor(1000 + Math.random() * 9000).toString();
    const opportunityCode = `OPP-${dateStr}-${randStr}`;

    // 6. Create Opportunity
    const opp = new Opportunity();
    opp.opportunityCode = opportunityCode;
    opp.lead = lead;
    opp.title = dto.title || `${lead.fullName} - Property Opportunity`;
    opp.opportunityStage = initialStage;
    opp.assignedSalesAgent = lead.assignedSalesAgent;
    opp.estimatedValue = dto.estimatedValue;
    opp.probabilityPercent = initialStage ? Number(initialStage.probabilityPercent) : 10.0;
    opp.expectedCloseDate = dto.expectedCloseDate ? new Date(dto.expectedCloseDate) : null;
    opp.isWon = false;
    opp.isLost = false;
    opp.remarks = dto.remarks || '';

    const savedOpp = await this.opportunityRepo.save(opp);

    // 7. Log initial activity for Opportunity
    const oppAct = new OpportunityActivity();
    oppAct.opportunity = savedOpp;
    oppAct.activityType = 'System';
    oppAct.activityDate = new Date();
    oppAct.subject = 'Opportunity Created';
    oppAct.description = `Created from Lead conversion: ${lead.fullName}`;
    await this.activityRepo.save(oppAct);

    // 8. Write conversion note if remarks exist
    if (dto.remarks) {
      const oppNote = new OpportunityNote();
      oppNote.opportunity = savedOpp;
      oppNote.note = dto.remarks;
      oppNote.isInternal = true;
      await this.noteRepo.save(oppNote);
    }

    return savedOpp;
  }

  async findAll(query: any): Promise<{ data: Opportunity[]; total: number; page: number; limit: number }> {
    const page = parseInt(query.page, 10) || 1;
    const limit = parseInt(query.limit, 10) || 10;
    const skip = (page - 1) * limit;

    const qb = this.opportunityRepo.createQueryBuilder('opp')
      .leftJoinAndSelect('opp.lead', 'lead')
      .leftJoinAndSelect('opp.opportunityStage', 'stage')
      .leftJoinAndSelect('opp.assignedSalesAgent', 'agent')
      .leftJoinAndSelect('opp.lossReason', 'lossReason')
      .where('opp.isDeleted = :isDeleted', { isDeleted: false })
      .orderBy('opp.createdAt', 'DESC');

    if (query.search) {
      const search = `%${query.search}%`;
      qb.andWhere(
        '(opp.title ILIKE :search OR opp.opportunityCode ILIKE :search OR lead.fullName ILIKE :search OR agent.fullName ILIKE :search)',
        { search },
      );
    }

    if (query.stageId && +query.stageId !== 0) {
      qb.andWhere('opp.opportunityStage = :stageId', { stageId: +query.stageId });
    }

    if (query.agentId && +query.agentId !== 0) {
      qb.andWhere('opp.assignedSalesAgent = :agentId', { agentId: +query.agentId });
    }

    qb.skip(skip).take(limit);
    const [data, total] = await qb.getManyAndCount();

    return {
      data,
      total,
      page,
      limit,
    };
  }

  async findOne(id: number): Promise<any> {
    const opp = await this.opportunityRepo.findOne({
      where: { id, isDeleted: false },
      relations: {
        lead: true,
        opportunityStage: true,
        assignedSalesAgent: true,
        lossReason: true,
      },
    });
    if (!opp) {
      throw new NotFoundException(`Opportunity with ID ${id} not found`);
    }

    const activities = await this.activityRepo.find({
      where: { opportunity: { id } },
      order: { activityDate: 'DESC' },
    });

    const notes = await this.noteRepo.find({
      where: { opportunity: { id } },
      order: { createdAt: 'DESC' },
    });

    return {
      ...opp,
      activities,
      notes,
    };
  }

  async updateStage(id: number, stageId: number): Promise<Opportunity> {
    const opp = await this.opportunityRepo.findOne({
      where: { id, isDeleted: false },
      relations: { opportunityStage: true },
    });
    if (!opp) {
      throw new NotFoundException(`Opportunity with ID ${id} not found`);
    }

    const stage = await this.stageRepo.findOne({ where: { id: stageId } });
    if (!stage) {
      throw new NotFoundException(`Opportunity Stage with ID ${stageId} not found`);
    }

    const prevStageName = opp.opportunityStage ? opp.opportunityStage.stageName : 'Unknown';
    opp.opportunityStage = stage;
    opp.probabilityPercent = Number(stage.probabilityPercent);

    if (stage.isClosed) {
      opp.actualCloseDate = new Date();
      if (stage.probabilityPercent >= 100 || stage.stageName === 'Closed Won') {
        opp.isWon = true;
        opp.isLost = false;
      } else {
        opp.isLost = true;
        opp.isWon = false;
      }
    } else {
      opp.isWon = false;
      opp.isLost = false;
      opp.actualCloseDate = null;
      opp.lossReason = null;
    }

    const saved = await this.opportunityRepo.save(opp);

    // Create activity audit
    const act = new OpportunityActivity();
    act.opportunity = saved;
    act.activityType = 'System';
    act.activityDate = new Date();
    act.subject = 'Stage Transitioned';
    act.description = `Pipeline stage transitioned from "${prevStageName}" to "${stage.stageName}"`;
    await this.activityRepo.save(act);

    return saved;
  }

  async closeLost(id: number, reasonId: number, remarks?: string): Promise<Opportunity> {
    const opp = await this.opportunityRepo.findOne({
      where: { id, isDeleted: false },
    });
    if (!opp) {
      throw new NotFoundException(`Opportunity with ID ${id} not found`);
    }

    const reason = await this.lossReasonRepo.findOne({ where: { id: reasonId } });
    if (!reason) {
      throw new NotFoundException(`Opportunity Loss Reason with ID ${reasonId} not found`);
    }

    let lostStage = await this.stageRepo.findOne({ where: { stageName: 'Closed Lost' } });
    if (!lostStage) {
      lostStage = await this.stageRepo.findOne({ where: { probabilityPercent: 0, isClosed: true } });
    }

    opp.opportunityStage = lostStage;
    opp.probabilityPercent = 0.0;
    opp.isLost = true;
    opp.isWon = false;
    opp.lossReason = reason;
    opp.actualCloseDate = new Date();
    if (remarks) {
      opp.remarks = remarks;
    }

    const saved = await this.opportunityRepo.save(opp);

    // Create activity log
    const act = new OpportunityActivity();
    act.opportunity = saved;
    act.activityType = 'System';
    act.activityDate = new Date();
    act.subject = 'Closed Lost';
    act.description = `Opportunity closed as Lost. Reason: ${reason.reasonName}. Remarks: ${remarks || '-'}`;
    await this.activityRepo.save(act);

    // Save as internal note too
    if (remarks) {
      const oppNote = new OpportunityNote();
      oppNote.opportunity = saved;
      oppNote.note = `Closure notes: ${remarks}`;
      oppNote.isInternal = true;
      await this.noteRepo.save(oppNote);
    }

    return saved;
  }

  async updateOpportunity(id: number, data: any): Promise<Opportunity> {
    const opp = await this.opportunityRepo.findOne({ where: { id, isDeleted: false } });
    if (!opp) {
      throw new NotFoundException(`Opportunity with ID ${id} not found`);
    }

    if (data.title !== undefined) opp.title = data.title;
    if (data.estimatedValue !== undefined) opp.estimatedValue = data.estimatedValue;
    if (data.probabilityPercent !== undefined) opp.probabilityPercent = data.probabilityPercent;
    if (data.expectedCloseDate !== undefined) {
      opp.expectedCloseDate = data.expectedCloseDate ? new Date(data.expectedCloseDate) : null;
    }
    if (data.remarks !== undefined) opp.remarks = data.remarks;

    return this.opportunityRepo.save(opp);
  }

  async addActivity(id: number, dto: any): Promise<OpportunityActivity> {
    const opp = await this.opportunityRepo.findOne({ where: { id, isDeleted: false } });
    if (!opp) {
      throw new NotFoundException(`Opportunity with ID ${id} not found`);
    }

    const act = new OpportunityActivity();
    act.opportunity = opp;
    act.activityType = dto.activityType || 'Meeting';
    act.activityDate = dto.activityDate ? new Date(dto.activityDate) : new Date();
    act.subject = dto.subject || 'Interaction logged';
    act.description = dto.description || '';
    act.outcome = dto.outcome || '';
    act.performedBy = dto.performedBy || 1;

    return this.activityRepo.save(act);
  }

  async addNote(id: number, noteContent: string): Promise<OpportunityNote> {
    const opp = await this.opportunityRepo.findOne({ where: { id, isDeleted: false } });
    if (!opp) {
      throw new NotFoundException(`Opportunity with ID ${id} not found`);
    }

    const note = new OpportunityNote();
    opp.updatedAt = new Date();
    await this.opportunityRepo.save(opp);

    note.opportunity = opp;
    note.note = noteContent;
    note.isInternal = true;

    return this.noteRepo.save(note);
  }

  async getMetadata() {
    const stages = await this.stageRepo.find({ order: { sortOrder: 'ASC' } });
    const lossReasons = await this.lossReasonRepo.find({ where: { isActive: true } });
    const agents = await this.agentRepo.find({ where: { isActive: true } });
    return {
      stages,
      lossReasons,
      agents,
    };
  }

  async getForecast(): Promise<any[]> {
    // Fetch all active or won opportunities with expectedCloseDate (or actualCloseDate for won ones)
    const opportunities = await this.opportunityRepo.find({
      where: { isDeleted: false },
      relations: { opportunityStage: true },
    });

    const monthlyMap = new Map<string, { monthStr: string; activeCount: number; estimatedRevenue: number; weightedRevenue: number }>();

    for (const opp of opportunities) {
      // Use expectedCloseDate for predictions, or actualCloseDate if won. Skip lost opportunities.
      if (opp.isLost) continue;
      const targetDate = opp.isWon ? opp.actualCloseDate : opp.expectedCloseDate;
      if (!targetDate) continue;

      const dateObj = new Date(targetDate);
      const year = dateObj.getFullYear();
      const month = String(dateObj.getMonth() + 1).padStart(2, '0');
      const key = `${year}-${month}`; // YYYY-MM

      const estVal = Number(opp.estimatedValue) || 0;
      const prob = Number(opp.probabilityPercent) || 0;
      const weightVal = estVal * (prob / 100);

      const entry = monthlyMap.get(key);
      if (entry) {
        entry.activeCount += 1;
        entry.estimatedRevenue += estVal;
        entry.weightedRevenue += weightVal;
      } else {
        const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
        const displayLabel = `${monthNames[dateObj.getMonth()]} ${year}`;
        monthlyMap.set(key, {
          monthStr: displayLabel,
          activeCount: 1,
          estimatedRevenue: estVal,
          weightedRevenue: weightVal,
        });
      }
    }

    // Convert map to sorted array based on key
    const sortedForecast = Array.from(monthlyMap.entries())
      .sort((a, b) => a[0].localeCompare(b[0]))
      .map(([key, data]) => ({
        monthKey: key,
        ...data,
      }));

    return sortedForecast;
  }
}
