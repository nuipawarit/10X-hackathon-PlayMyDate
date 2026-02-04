export const SPLIT_BILL_OPTIONS = {
  SPLIT_50_50: '50_50',
  ILL_PAY: 'ill_pay',
  THEY_PAY: 'they_pay',
  SPLIT_BY_ITEM: 'by_item',
  DECIDE_LATER: 'decide_later',
} as const;

export type SplitBillOption = typeof SPLIT_BILL_OPTIONS[keyof typeof SPLIT_BILL_OPTIONS];

export const SPLIT_BILL_LABELS: Record<string, string> = {
  '50_50': 'Split 50/50',
  'ill_pay': "I'll pay",
  'they_pay': 'They pay',
  'by_item': 'Split by item',
  'decide_later': 'Decide later',
  'split': 'Split evenly',
  'treat': 'I will treat',
};

export const SPLIT_BILL_ICONS: Record<string, string> = {
  '50_50': '⚖️',
  'ill_pay': '🎁',
  'they_pay': '🙏',
  'by_item': '📋',
  'decide_later': '🤔',
  'split': '⚖️',
  'treat': '🎁',
};
