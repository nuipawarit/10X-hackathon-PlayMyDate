'use client';

import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { SPLIT_BILL_OPTIONS, SPLIT_BILL_LABELS, SPLIT_BILL_ICONS } from '@/lib/constants/splitBill';

interface SplitBillSelectorProps {
  value: string;
  onChange: (value: string) => void;
  label?: string;
}

const OPTIONS = [
  { value: SPLIT_BILL_OPTIONS.SPLIT_50_50, label: SPLIT_BILL_LABELS['50_50'], icon: SPLIT_BILL_ICONS['50_50'], desc: 'Split the bill equally' },
  { value: SPLIT_BILL_OPTIONS.ILL_PAY, label: SPLIT_BILL_LABELS['ill_pay'], icon: SPLIT_BILL_ICONS['ill_pay'], desc: 'You cover the whole bill' },
  { value: SPLIT_BILL_OPTIONS.THEY_PAY, label: SPLIT_BILL_LABELS['they_pay'], icon: SPLIT_BILL_ICONS['they_pay'], desc: 'Your date covers the bill' },
  { value: SPLIT_BILL_OPTIONS.SPLIT_BY_ITEM, label: SPLIT_BILL_LABELS['by_item'], icon: SPLIT_BILL_ICONS['by_item'], desc: 'Each pays for their own items' },
  { value: SPLIT_BILL_OPTIONS.DECIDE_LATER, label: SPLIT_BILL_LABELS['decide_later'], icon: SPLIT_BILL_ICONS['decide_later'], desc: 'Decide at the venue' },
];

export function SplitBillSelector({ value, onChange, label = 'Split Bill Preference' }: SplitBillSelectorProps) {
  return (
    <div className="space-y-2">
      <Label>{label}</Label>
      <Select value={value} onValueChange={onChange}>
        <SelectTrigger>
          <SelectValue placeholder="How to split the bill?" />
        </SelectTrigger>
        <SelectContent>
          {OPTIONS.map((option) => (
            <SelectItem key={option.value} value={option.value}>
              <span className="flex items-center gap-2">
                <span>{option.icon}</span>
                <span>{option.label}</span>
              </span>
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}
