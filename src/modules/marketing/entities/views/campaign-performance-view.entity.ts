import { DataSource, ViewEntity, ViewColumn } from 'typeorm';

@ViewEntity({
  name: 'vw_rems_campaign_performance',
  expression: (connection: DataSource) =>
    connection
      .createQueryBuilder()
      .select('mc.campaign_id', 'campaign_id')
      .addSelect('mc.campaign_name', 'campaign_name')
      .addSelect(
        '(SELECT COUNT(ml.marketing_lead_id) FROM rems_marketing_lead ml WHERE ml.campaign_id = mc.campaign_id)',
        'total_leads',
      )
      .addSelect(
        '(SELECT COUNT(ml.marketing_lead_id) FROM rems_marketing_lead ml WHERE ml.campaign_id = mc.campaign_id AND ml.conversion_probability >= 70)',
        'qualified_leads',
      )
      .addSelect(
        '(SELECT COUNT(s.booking_id) FROM rems_marketing_lead ml JOIN crm_customer cust ON cust.lead_id = ml.lead_id JOIN sales_booking s ON s.customer_id = cust.id WHERE ml.campaign_id = mc.campaign_id AND s.status = \'APPROVED\')',
        'converted_sales',
      )
      .addSelect(
        'COALESCE((SELECT SUM(s.booking_amount) FROM rems_marketing_lead ml JOIN crm_customer cust ON cust.lead_id = ml.lead_id JOIN sales_booking s ON s.customer_id = cust.id WHERE ml.campaign_id = mc.campaign_id AND s.status = \'APPROVED\'), 0)',
        'total_revenue',
      )
      .addSelect(
        'COALESCE((SELECT SUM(ae.expense_amount) FROM rems_advertisement ad JOIN rems_advertisement_expense ae ON ae.advertisement_id = ad.advertisement_id WHERE ad.campaign_id = mc.campaign_id), 0)',
        'total_expense',
      )
      .from('rems_marketing_campaign', 'mc'),
})
export class CampaignPerformanceView {
  @ViewColumn({ name: 'campaign_id' })
  campaignId: number;

  @ViewColumn({ name: 'campaign_name' })
  campaignName: string;

  @ViewColumn({ name: 'total_leads' })
  totalLeads: number;

  @ViewColumn({ name: 'qualified_leads' })
  qualifiedLeads: number;

  @ViewColumn({ name: 'converted_sales' })
  convertedSales: number;

  @ViewColumn({ name: 'total_revenue' })
  totalRevenue: number;

  @ViewColumn({ name: 'total_expense' })
  totalExpense: number;
}
