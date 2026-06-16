import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CustomerSegment } from '../entities/customer-segment.entity';
import { CustomerSegmentRule } from '../entities/customer-segment-rule.entity';
import { CustomerTag } from '../entities/customer-tag.entity';
import { Lead } from '../entities/lead.entity';

@Injectable()
export class SegmentationService {
  constructor(
    @InjectRepository(CustomerSegment)
    private readonly segmentRepo: Repository<CustomerSegment>,
    @InjectRepository(CustomerSegmentRule)
    private readonly ruleRepo: Repository<CustomerSegmentRule>,
    @InjectRepository(CustomerTag)
    private readonly tagRepo: Repository<CustomerTag>,
    @InjectRepository(Lead)
    private readonly leadRepo: Repository<Lead>,
  ) {}

  // ================= Tags CRUD =================
  async findAllTags(): Promise<CustomerTag[]> {
    return this.tagRepo.find({ order: { tagName: 'ASC' } });
  }

  async createTag(dto: { tagName: string; colorCode?: string }): Promise<CustomerTag> {
    if (!dto.tagName) {
      throw new BadRequestException('Tag name is required');
    }
    const existing = await this.tagRepo.findOne({ where: { tagName: dto.tagName } });
    if (existing) {
      return existing;
    }
    const tag = new CustomerTag();
    tag.tagName = dto.tagName;
    tag.colorCode = dto.colorCode ?? '#6b7280';
    return this.tagRepo.save(tag);
  }

  // ================= Segments CRUD =================
  async findAllSegments(): Promise<any[]> {
    // Return segments along with rule count and member count
    const segments = await this.segmentRepo.find({
      relations: { rules: true, members: true },
      order: { segmentName: 'ASC' },
    });

    return segments.map(s => ({
      id: s.id,
      segmentName: s.segmentName,
      description: s.description,
      isActive: s.isActive,
      ruleCount: s.rules?.length || 0,
      memberCount: s.members?.length || 0,
      rules: s.rules,
    }));
  }

  async findOneSegment(id: number): Promise<CustomerSegment> {
    const segment = await this.segmentRepo.findOne({
      where: { id },
      relations: { rules: true, members: { leadStatus: true, leadSource: true, assignedSalesAgent: true } },
    });
    if (!segment) {
      throw new NotFoundException(`Customer Segment with ID ${id} not found`);
    }
    return segment;
  }

  async createSegment(dto: {
    segmentName: string;
    description?: string;
    rules: { fieldName: string; operator: string; value: string }[];
  }): Promise<CustomerSegment> {
    if (!dto.segmentName) {
      throw new BadRequestException('Segment name is required');
    }

    const segment = new CustomerSegment();
    segment.segmentName = dto.segmentName;
    segment.description = dto.description ?? '';
    segment.isActive = true;
    segment.rules = [];

    const savedSegment = await this.segmentRepo.save(segment);

    if (dto.rules && dto.rules.length > 0) {
      const rules = dto.rules.map(r => {
        const rule = new CustomerSegmentRule();
        rule.segment = savedSegment;
        rule.fieldName = r.fieldName;
        rule.operator = r.operator;
        rule.value = r.value;
        return rule;
      });
      await this.ruleRepo.save(rules);
    }

    // Run dynamic recalculation instantly to populate members
    return this.recalculateSegment(savedSegment.id);
  }

  async deleteSegment(id: number): Promise<boolean> {
    const segment = await this.segmentRepo.findOne({ where: { id } });
    if (!segment) {
      throw new NotFoundException(`Customer Segment with ID ${id} not found`);
    }
    await this.segmentRepo.remove(segment);
    return true;
  }

  // ================= Recalculate Engine =================
  async recalculateSegment(id: number): Promise<CustomerSegment> {
    const segment = await this.segmentRepo.findOne({
      where: { id },
      relations: { rules: true },
    });
    if (!segment) {
      throw new NotFoundException(`Customer Segment with ID ${id} not found`);
    }

    // Compile dynamic QueryBuilder based on segment rules
    const qb = this.leadRepo.createQueryBuilder('lead')
      .leftJoinAndSelect('lead.leadStatus', 'leadStatus')
      .leftJoinAndSelect('lead.leadSource', 'leadSource')
      .leftJoinAndSelect('lead.assignedSalesAgent', 'assignedSalesAgent')
      .where('lead.isDeleted = :isDeleted', { isDeleted: false });

    segment.rules.forEach((rule, idx) => {
      const paramName = `rule_val_${idx}`;
      let dbField = '';

      // Map dynamic fields
      if (rule.fieldName === 'statusId') {
        dbField = 'leadStatus.id';
      } else if (rule.fieldName === 'sourceId') {
        dbField = 'leadSource.id';
      } else if (rule.fieldName === 'agentId') {
        dbField = 'assignedSalesAgent.id';
      } else {
        dbField = `lead.${rule.fieldName}`;
      }

      // Map dynamic comparison conditions
      if (rule.operator === 'LIKE') {
        qb.andWhere(`${dbField} ILIKE :${paramName}`, { [paramName]: `%${rule.value}%` });
      } else if (rule.operator === 'IN') {
        const arrayValues = rule.value.split(',').map(v => v.trim());
        qb.andWhere(`${dbField} IN (:...${paramName})`, { [paramName]: arrayValues });
      } else if (rule.operator === '=') {
        qb.andWhere(`${dbField} = :${paramName}`, { [paramName]: rule.value });
      } else if (rule.operator === '!=') {
        qb.andWhere(`${dbField} != :${paramName}`, { [paramName]: rule.value });
      } else if (rule.operator === '>') {
        qb.andWhere(`${dbField} > :${paramName}`, { [paramName]: Number(rule.value) || 0 });
      } else if (rule.operator === '<') {
        qb.andWhere(`${dbField} < :${paramName}`, { [paramName]: Number(rule.value) || 0 });
      } else if (rule.operator === '>=') {
        qb.andWhere(`${dbField} >= :${paramName}`, { [paramName]: Number(rule.value) || 0 });
      } else if (rule.operator === '<=') {
        qb.andWhere(`${dbField} <= :${paramName}`, { [paramName]: Number(rule.value) || 0 });
      }
    });

    const matchingLeads = await qb.getMany();

    // Cache segment members
    segment.members = matchingLeads;
    const saved = await this.segmentRepo.save(segment);

    // Refresh return
    return this.findOneSegment(saved.id);
  }
}
