'use client';

import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { BillingOverview, InvoiceList } from '@/components/b2b';

export default function BillingPage() {
  return (
    <div className="space-y-6">
      <div className="animate-slide-up">
        <h1 className="text-3xl font-extrabold gradient-text">Billing</h1>
        <p className="text-gray-500 mt-1">
          Manage your billing and view invoices
        </p>
      </div>

      <Tabs defaultValue="overview" className="space-y-6 animate-slide-up" style={{ animationDelay: '0.1s' }}>
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="invoices">Invoices</TabsTrigger>
        </TabsList>

        <TabsContent value="overview">
          <BillingOverview />
        </TabsContent>

        <TabsContent value="invoices">
          <InvoiceList />
        </TabsContent>
      </Tabs>
    </div>
  );
}
