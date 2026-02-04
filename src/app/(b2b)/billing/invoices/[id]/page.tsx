'use client';

import { use, useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
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
      <div className="space-y-6 max-w-3xl mx-auto">
        <div className="skeleton h-9 w-48" />
        <div className="skeleton h-96 rounded-2xl" />
      </div>
    );
  }

  if (!invoice) {
    return (
      <div className="max-w-3xl mx-auto">
        <div className="card text-center py-16 animate-bounce-in">
          <div className="w-16 h-16 mx-auto mb-4 rounded-3xl bg-gradient-to-br from-purple-100 to-rose-100 flex items-center justify-center animate-float">
            <svg className="w-8 h-8 text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
          </div>
          <h3 className="text-lg font-bold text-gray-800 mb-2">Invoice not found</h3>
          <button onClick={() => router.back()} className="btn-secondary mt-4">Go Back</button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-3xl mx-auto">
      <div className="flex items-center justify-between print:hidden animate-slide-up">
        <h1 className="text-3xl font-extrabold gradient-text">Invoice Details</h1>
        <button className="btn-secondary" onClick={() => router.push('/b2b/billing')}>
          Back to Billing
        </button>
      </div>

      <div className="animate-slide-up" style={{ animationDelay: '0.1s' }}>
        <InvoiceDetail invoice={invoice} />
      </div>
    </div>
  );
}
