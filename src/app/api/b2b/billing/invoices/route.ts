import { NextRequest, NextResponse } from 'next/server';
import { withB2BAuth } from '@/lib/api-auth-b2b';
import { sql } from '@/lib/db';

export async function GET(request: NextRequest) {
  return withB2BAuth(request, async (merchantId) => {
    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status');
    const limit = parseInt(searchParams.get('limit') || '20');
    const offset = parseInt(searchParams.get('offset') || '0');

    try {
      const statusFilter = status ? `AND status = '${status}'` : '';
      const campaigns = await sql.query(`
        SELECT
          id,
          name,
          COALESCE(spent::numeric, 0) as amount,
          status,
          created_at as invoice_date,
          CASE
            WHEN status = 'completed' THEN 'paid'
            WHEN status = 'cancelled' THEN 'cancelled'
            ELSE 'pending'
          END as payment_status
        FROM campaigns
        WHERE merchant_id = $1 ${statusFilter}
        ORDER BY created_at DESC
        LIMIT $2 OFFSET $3
      `, [merchantId, limit, offset]);

      const totalResult = await sql`
        SELECT
          COUNT(*) as total_invoices,
          SUM(COALESCE(spent::numeric, 0)) as total_amount,
          SUM(CASE WHEN status = 'active' THEN COALESCE(spent::numeric, 0) ELSE 0 END) as pending_amount
        FROM campaigns
        WHERE merchant_id = ${merchantId}
      `;

      const invoices = campaigns.rows.map((row, index) => ({
        id: `INV-${row.id.slice(0, 8).toUpperCase()}`,
        campaignId: row.id,
        campaignName: row.name,
        amount: parseFloat(row.amount),
        status: row.payment_status,
        invoiceDate: row.invoice_date,
        dueDate: new Date(new Date(row.invoice_date).getTime() + 30 * 24 * 60 * 60 * 1000),
      }));

      return NextResponse.json({
        invoices,
        summary: {
          totalInvoices: parseInt(totalResult.rows[0]?.total_invoices || '0'),
          totalAmount: parseFloat(totalResult.rows[0]?.total_amount || '0'),
          pendingAmount: parseFloat(totalResult.rows[0]?.pending_amount || '0'),
        },
      });
    } catch (error) {
      console.error('GET invoices error:', error);
      return NextResponse.json({ error: 'Failed to get invoices' }, { status: 500 });
    }
  });
}
