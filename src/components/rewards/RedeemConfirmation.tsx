'use client';

import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import type { Reward } from '@/lib/api';

interface RedeemConfirmationProps {
  reward: Reward;
  userBalance: number;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm: () => void;
  loading?: boolean;
}

export default function RedeemConfirmation({
  reward,
  userBalance,
  open,
  onOpenChange,
  onConfirm,
  loading,
}: RedeemConfirmationProps) {
  const newBalance = userBalance - reward.coin_cost;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Confirm Redemption</DialogTitle>
          <DialogDescription>
            Are you sure you want to redeem this reward?
          </DialogDescription>
        </DialogHeader>

        <div className="py-4 space-y-4">
          <div className="p-4 bg-gray-50 rounded-lg">
            <h4 className="font-semibold">{reward.name}</h4>
            <p className="text-sm text-muted-foreground">{reward.description}</p>
          </div>

          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span>Current Balance</span>
              <span className="font-medium">🪙 {userBalance.toLocaleString()}</span>
            </div>
            <div className="flex justify-between text-sm text-red-600">
              <span>Cost</span>
              <span className="font-medium">- 🪙 {reward.coin_cost.toLocaleString()}</span>
            </div>
            <hr />
            <div className="flex justify-between font-semibold">
              <span>New Balance</span>
              <span className="text-yellow-600">🪙 {newBalance.toLocaleString()}</span>
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={loading}>
            Cancel
          </Button>
          <Button onClick={onConfirm} disabled={loading}>
            {loading ? 'Redeeming...' : 'Confirm Redemption'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
