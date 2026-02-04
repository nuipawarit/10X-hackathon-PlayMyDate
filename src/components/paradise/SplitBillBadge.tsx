'use client';

import { Badge } from '@/components/ui/badge';
import { SPLIT_BILL_LABELS, SPLIT_BILL_ICONS } from '@/lib/constants/splitBill';

interface SplitBillBadgeProps {
  preference?: string | null;
  className?: string;
}

export function SplitBillBadge({ preference, className }: SplitBillBadgeProps) {
  if (!preference) return null;

  const label = SPLIT_BILL_LABELS[preference] || preference;
  const icon = SPLIT_BILL_ICONS[preference] || '💰';

  return (
    <Badge variant="outline" className={className}>
      {icon} {label}
    </Badge>
  );
}
