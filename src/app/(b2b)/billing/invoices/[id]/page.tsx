'use client';

import { use, useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { InvoiceDetail } from '@/components/b2b/InvoiceDetail';
import type { Invoice } from '@/lib/services/billing';

export default function InvoiceDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const router = useRouter();
  const [invoice, setInvoice] = useState<Invoice | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchInvoice() {
      try {
        const res = await fetch(`/api/b2b/billing/invoices/${id}`, { credentials: 'include' });
        if (res.ok) {
          const data = await res.json();
          setInvoice(data.invoice);
        }
      } finally {
        setLoading(false);
      }
    }
    fetchInvoice();
  }, [id]);

  if (loading) {
    return (
      <div className="space-y-6 animate-pulse">
        <div className="h-8 bg-muted rounded w-48" />
        <div className="h-64 bg-muted rounded" />
      </div>
    );
  }

  if (!invoice) {
    return (
      <div className="text-center py-12">
        <p className="text-muted-foreground">Invoice not found</p>
        <Button onClick={() => router.back()} className="mt-4">Go Back</Button>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-3xl mx-auto">
      <div className="flex items-center justify-between print:hidden">
        <h1 className="text-2xl font-bold">Invoice Details</h1>
        <Button variant="outline" onClick={() => router.push('/billing')}>
          Back to Billing
        </Button>
      </div>

      <InvoiceDetail invoice={invoice} />
    </div>
  );
}
