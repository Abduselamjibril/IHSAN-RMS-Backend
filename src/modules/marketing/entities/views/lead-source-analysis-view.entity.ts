import { DataSource, ViewEntity, ViewColumn } from 'typeorm';

@ViewEntity({
  name: 'vw_rems_lead_source_analysis',
  expression: (connection: DataSource) =>
    connection
      .createQueryBuilder()
      .select('ls.id', 'lead_source_id')
      .addSelect('ls.source_name', 'source_name')
      .addSelect('COUNT(ml.marketing_lead_id)', 'total_leads')
      .addSelect('COUNT(s.booking_id)', 'total_conversions')
      .from('crm_lead_source', 'ls')
      .leftJoin('rems_marketing_lead', 'ml', 'ml.lead_source_id = ls.id')
      .leftJoin('crm_customer', 'cust', 'cust.lead_id = ml.lead_id')
      .leftJoin('sales_booking', 's', 's.customer_id = cust.id')
      .groupBy('ls.id')
      .addGroupBy('ls.source_name'),
})
export class LeadSourceAnalysisView {
  @ViewColumn({ name: 'lead_source_id' })
  leadSourceId: number;

  @ViewColumn({ name: 'source_name' })
  sourceName: string;

  @ViewColumn({ name: 'total_leads' })
  totalLeads: number;

  @ViewColumn({ name: 'total_conversions' })
  totalConversions: number;
}
