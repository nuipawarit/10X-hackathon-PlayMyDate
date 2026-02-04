import { NextRequest, NextResponse } from 'next/server';
import { withB2BAuth } from '@/lib/api-auth-b2b';
import { getReportData, generateCSV, generateReportHTML } from '@/lib/services/report-export';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  return withB2BAuth(request, async (merchantId) => {
    const { id } = await params;
    const { searchParams } = new URL(request.url);
    const format = searchParams.get('format') || 'csv';

    const result = await getReportData(id, merchantId);

    if (!result.success) {
      const status = result.code === 'NOT_FOUND' ? 404 : 500;
      return NextResponse.json({ error: result.error }, { status });
    }

    const report = result.data;

    if (format === 'csv') {
      const csv = generateCSV(report);
      return new NextResponse(csv, {
        headers: {
          'Content-Type': 'text/csv',
          'Content-Disposition': `attachment; filename="report-${report.type}-${report.period}.csv"`,
        },
      });
    }

    if (format === 'html') {
      const html = generateReportHTML(report);
      return new NextResponse(html, {
        headers: {
          'Content-Type': 'text/html',
          'Content-Disposition': `attachment; filename="report-${report.type}-${report.period}.html"`,
        },
      });
    }

    return NextResponse.json({ error: 'Invalid format. Use csv or html' }, { status: 400 });
  });
}
