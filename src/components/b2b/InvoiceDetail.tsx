'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import type { Invoice } from '@/lib/services/billing';

interface InvoiceDetailProps {
  invoice: Invoice;
  onPrint?: () => void;
}

export function InvoiceDetail({ invoice, onPrint }: InvoiceDetailProps) {
  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'paid':
        return <Badge className="bg-green-500">Paid</Badge>;
      case 'issued':
        return <Badge className="bg-blue-500">Issued</Badge>;
      case 'overdue':
        return <Badge variant="destructive">Overdue</Badge>;
      case 'cancelled':
        return <Badge variant="outline">Cancelled</Badge>;
      default:
        return <Badge variant="secondary">{status}</Badge>;
    }
  };

  const handlePrint = () => {
    if (onPrint) {
      onPrint();
    } else {
      window.print();
    }
  };

  return (
    <Card className="print:shadow-none print:border-none">
      <CardHeader className="flex flex-row items-start justify-between">
        <div>
          <CardTitle>Invoice {invoice.invoiceNumber}</CardTitle>
          <p className="text-sm text-muted-foreground mt-1">
            {invoice.merchantName}
          </p>
        </div>
        <div className="flex items-center gap-2 print:hidden">
          {getStatusBadge(invoice.status)}
          <Button variant="outline" size="sm" onClick={handlePrint}>
            Print
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="grid grid-cols-2 gap-4 text-sm">
          <div>
            <p className="text-muted-foreground">Invoice Date</p>
            <p className="font-medium">{new Date(invoice.createdAt).toLocaleDateString()}</p>
          </div>
          <div>
            <p className="text-muted-foreground">Due Date</p>
            <p className="font-medium">{new Date(invoice.dueDate).toLocaleDateString()}</p>
          </div>
          <div>
            <p className="text-muted-foreground">Billing Period</p>
            <p className="font-medium">
              {new Date(invoice.billingPeriodStart).toLocaleDateString()} - {new Date(invoice.billingPeriodEnd).toLocaleDateString()}
            </p>
          </div>
          <div>
            <p className="text-muted-foreground">Status</p>
            <p className="font-medium capitalize">{invoice.status}</p>
          </div>
        </div>

        <div className="border rounded-lg overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-muted">
              <tr>
                <th className="text-left p-3">Description</th>
                <th className="text-right p-3">Qty</th>
                <th className="text-right p-3">Unit Price</th>
                <th className="text-right p-3">Total</th>
              </tr>
            </thead>
            <tbody>
              {invoice.lineItems.map((item, idx) => (
                <tr key={idx} className="border-t">
                  <td className="p-3">{item.description}</td>
                  <td className="text-right p-3">{item.quantity}</td>
                  <td className="text-right p-3">฿{item.unitPrice.toLocaleString()}</td>
                  <td className="text-right p-3">฿{item.total.toLocaleString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="flex justify-end">
          <div className="w-64 space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Subtotal</span>
              <span>฿{invoice.subtotal.toLocaleString()}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">VAT (7%)</span>
              <span>฿{invoice.tax.toLocaleString()}</span>
            </div>
            <div className="flex justify-between border-t pt-2 font-bold">
              <span>Total</span>
              <span>฿{invoice.total.toLocaleString()}</span>
            </div>
          </div>
        </div>

        {invoice.paidAt && (
          <div className="text-sm text-muted-foreground text-center border-t pt-4">
            Paid on {new Date(invoice.paidAt).toLocaleDateString()}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
