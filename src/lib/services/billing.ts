import { sql } from '@/lib/db';
import { success, failure, type ServiceResult } from './types';

export interface InvoiceLineItem {
  description: string;
  campaignId?: string;
  campaignName?: string;
  quantity: number;
  unitPrice: number;
  total: number;
}

export interface Invoice {
  id: string;
  invoiceNumber: string;
  merchantId: string;
  merchantName?: string;
  billingPeriodStart: Date;
  billingPeriodEnd: Date;
  subtotal: number;
  tax: number;
  total: number;
  status: 'draft' | 'issued' | 'paid' | 'overdue' | 'cancelled';
  dueDate: Date;
  paidAt?: Date;
  lineItems: InvoiceLineItem[];
  createdAt: Date;
}

export async function generateInvoice(
  merchantId: string,
  periodStart: Date,
  periodEnd: Date
): Promise<ServiceResult<Invoice>> {
  try {
    const merchantResult = await sql`
      SELECT business_name FROM merchants WHERE id = ${merchantId}
    `;

    if (merchantResult.rows.length === 0) {
      return failure('Merchant not found', 'NOT_FOUND');
    }

    const merchantName = merchantResult.rows[0].business_name as string;

    const campaignsResult = await sql`
      SELECT id, name, COALESCE(spent, 0) as spent
      FROM campaigns
      WHERE merchant_id = ${merchantId}
      AND created_at >= ${periodStart.toISOString()}
      AND created_at <= ${periodEnd.toISOString()}
      AND COALESCE(spent::numeric, 0) > 0
    `;

    const lineItems: InvoiceLineItem[] = campaignsResult.rows.map(row => ({
      description: `Campaign: ${row.name}`,
      campaignId: row.id as string,
      campaignName: row.name as string,
      quantity: 1,
      unitPrice: parseFloat(row.spent as string),
      total: parseFloat(row.spent as string),
    }));

    const subtotal = lineItems.reduce((sum, item) => sum + item.total, 0);
    const tax = subtotal * 0.07;
    const total = subtotal + tax;

    const invoiceNumber = `INV-${Date.now().toString(36).toUpperCase()}`;
    const dueDate = new Date();
    dueDate.setDate(dueDate.getDate() + 30);

    const invoice: Invoice = {
      id: crypto.randomUUID(),
      invoiceNumber,
      merchantId,
      merchantName,
      billingPeriodStart: periodStart,
      billingPeriodEnd: periodEnd,
      subtotal,
      tax,
      total,
      status: 'issued',
      dueDate,
      lineItems,
      createdAt: new Date(),
    };

    return success(invoice);
  } catch (error) {
    console.error('generateInvoice error:', error);
    return failure('Failed to generate invoice', 'INTERNAL_ERROR');
  }
}

export async function getInvoiceFromCampaign(
  merchantId: string,
  campaignId: string
): Promise<ServiceResult<Invoice>> {
  try {
    const result = await sql`
      SELECT c.*, m.business_name as merchant_name
      FROM campaigns c
      JOIN merchants m ON c.merchant_id = m.id
      WHERE c.id = ${campaignId} AND c.merchant_id = ${merchantId}
    `;

    if (result.rows.length === 0) {
      return failure('Campaign not found', 'NOT_FOUND');
    }

    const campaign = result.rows[0];
    const spent = parseFloat(campaign.spent as string || '0');
    const tax = spent * 0.07;

    const invoice: Invoice = {
      id: campaignId,
      invoiceNumber: `INV-${(campaign.id as string).slice(0, 8).toUpperCase()}`,
      merchantId,
      merchantName: campaign.merchant_name as string,
      billingPeriodStart: new Date(campaign.start_date as string || campaign.created_at as string),
      billingPeriodEnd: new Date(campaign.end_date as string || new Date()),
      subtotal: spent,
      tax,
      total: spent + tax,
      status: campaign.status === 'completed' ? 'paid' : campaign.status === 'cancelled' ? 'cancelled' : 'issued',
      dueDate: new Date(new Date(campaign.created_at as string).getTime() + 30 * 24 * 60 * 60 * 1000),
      lineItems: [{
        description: `Campaign: ${campaign.name}`,
        campaignId: campaign.id as string,
        campaignName: campaign.name as string,
        quantity: 1,
        unitPrice: spent,
        total: spent,
      }],
      createdAt: new Date(campaign.created_at as string),
    };

    return success(invoice);
  } catch (error) {
    console.error('getInvoiceFromCampaign error:', error);
    return failure('Failed to get invoice', 'INTERNAL_ERROR');
  }
}
