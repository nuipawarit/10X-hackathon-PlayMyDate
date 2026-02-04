import { sql } from '@/lib/db';
import { success, failure, type ServiceResult } from './types';

export interface ReportData {
  id: string;
  type: string;
  period: string;
  generatedAt: Date;
  data: Record<string, unknown>;
}

export async function getReportData(
  reportId: string,
  merchantId: string
): Promise<ServiceResult<ReportData>> {
  try {
    const result = await sql`
      SELECT * FROM analytics_reports
      WHERE id = ${reportId} AND merchant_id = ${merchantId}
    `;

    if (result.rows.length === 0) {
      return failure('Report not found', 'NOT_FOUND');
    }

    const report = result.rows[0];

    return success({
      id: report.id as string,
      type: report.type as string,
      period: report.period as string,
      generatedAt: new Date(report.generated_at as string),
      data: report.data as Record<string, unknown>,
    });
  } catch (error) {
    console.error('getReportData error:', error);
    return failure('Failed to get report data', 'INTERNAL_ERROR');
  }
}

export function generateCSV(report: ReportData): string {
  const lines: string[] = [];

  lines.push(`Report Type,${report.type}`);
  lines.push(`Period,${report.period}`);
  lines.push(`Generated At,${report.generatedAt.toISOString()}`);
  lines.push('');

  if (report.type === 'overview') {
    lines.push('Metric,Value');
    const data = report.data as Record<string, number>;
    Object.entries(data).forEach(([key, value]) => {
      lines.push(`${key},${value}`);
    });
  } else if (report.type === 'campaigns') {
    const campaigns = (report.data as { campaigns?: Array<Record<string, unknown>> }).campaigns || [];
    if (campaigns.length > 0) {
      const headers = Object.keys(campaigns[0]);
      lines.push(headers.join(','));
      campaigns.forEach(campaign => {
        lines.push(headers.map(h => String(campaign[h] || '')).join(','));
      });
    }
  } else {
    lines.push('Data');
    lines.push(JSON.stringify(report.data));
  }

  return lines.join('\n');
}

export function generateReportHTML(report: ReportData): string {
  const formatValue = (value: unknown): string => {
    if (typeof value === 'number') {
      return value.toLocaleString();
    }
    if (value instanceof Date) {
      return value.toLocaleDateString();
    }
    return String(value);
  };

  let dataSection = '';

  if (report.type === 'overview') {
    const data = report.data as Record<string, number>;
    dataSection = `
      <table style="width: 100%; border-collapse: collapse; margin-top: 20px;">
        <thead>
          <tr style="background: #f5f5f5;">
            <th style="padding: 10px; border: 1px solid #ddd; text-align: left;">Metric</th>
            <th style="padding: 10px; border: 1px solid #ddd; text-align: right;">Value</th>
          </tr>
        </thead>
        <tbody>
          ${Object.entries(data).map(([key, value]) => `
            <tr>
              <td style="padding: 10px; border: 1px solid #ddd;">${key}</td>
              <td style="padding: 10px; border: 1px solid #ddd; text-align: right;">${formatValue(value)}</td>
            </tr>
          `).join('')}
        </tbody>
      </table>
    `;
  } else {
    dataSection = `<pre style="background: #f5f5f5; padding: 15px; border-radius: 4px;">${JSON.stringify(report.data, null, 2)}</pre>`;
  }

  return `
    <!DOCTYPE html>
    <html>
    <head>
      <title>Report - ${report.type}</title>
      <style>
        body { font-family: Arial, sans-serif; max-width: 800px; margin: 0 auto; padding: 20px; }
        h1 { color: #333; }
        .meta { color: #666; margin-bottom: 20px; }
      </style>
    </head>
    <body>
      <h1>${report.type.charAt(0).toUpperCase() + report.type.slice(1)} Report</h1>
      <div class="meta">
        <p>Period: ${report.period}</p>
        <p>Generated: ${report.generatedAt.toLocaleString()}</p>
      </div>
      ${dataSection}
    </body>
    </html>
  `;
}
