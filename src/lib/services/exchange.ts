import { sql } from '@/lib/db';
import { success, failure, type ServiceResult } from './types';
import { burnCoins } from './playcoin';

export interface ExchangePartner {
  id: string;
  name: string;
  logoUrl: string | null;
  description: string | null;
  exchangeRate: number;
  minAmount: number;
  maxAmount: number;
  rewardType: string;
  isActive: boolean;
}

export interface ExchangeResult {
  transactionId: string;
  partnerId: string;
  partnerName: string;
  coinsSpent: number;
  rewardValue: number;
  rewardType: string;
  code: string;
  expiresAt: Date | null;
}

const PARTNERS: ExchangePartner[] = [
  {
    id: 'partner-starbucks',
    name: 'Starbucks',
    logoUrl: '/partners/starbucks.png',
    description: 'Exchange PlayCoins for Starbucks e-Vouchers',
    exchangeRate: 100,
    minAmount: 100,
    maxAmount: 1000,
    rewardType: 'voucher',
    isActive: true,
  },
  {
    id: 'partner-grab',
    name: 'Grab',
    logoUrl: '/partners/grab.png',
    description: 'Exchange PlayCoins for Grab credits',
    exchangeRate: 80,
    minAmount: 200,
    maxAmount: 2000,
    rewardType: 'credit',
    isActive: true,
  },
  {
    id: 'partner-lineman',
    name: 'LINE MAN',
    logoUrl: '/partners/lineman.png',
    description: 'Exchange PlayCoins for LINE MAN vouchers',
    exchangeRate: 90,
    minAmount: 100,
    maxAmount: 1500,
    rewardType: 'voucher',
    isActive: true,
  },
  {
    id: 'partner-major',
    name: 'Major Cineplex',
    logoUrl: '/partners/major.png',
    description: 'Exchange PlayCoins for movie tickets',
    exchangeRate: 150,
    minAmount: 300,
    maxAmount: 900,
    rewardType: 'ticket',
    isActive: true,
  },
];

export async function getExchangePartners(): Promise<ServiceResult<ExchangePartner[]>> {
  try {
    const activePartners = PARTNERS.filter(p => p.isActive);
    return success(activePartners);
  } catch (error) {
    console.error('getExchangePartners error:', error);
    return failure('Failed to get exchange partners', 'INTERNAL_ERROR');
  }
}

export async function calculateExchangeRate(
  partnerId: string,
  amount: number
): Promise<ServiceResult<{ coinsRequired: number; rewardValue: number; exchangeRate: number }>> {
  try {
    const partner = PARTNERS.find(p => p.id === partnerId);

    if (!partner) {
      return failure('Partner not found', 'NOT_FOUND');
    }

    if (!partner.isActive) {
      return failure('Partner is not available', 'PARTNER_INACTIVE');
    }

    if (amount < partner.minAmount) {
      return failure(`Minimum amount is ${partner.minAmount} coins`, 'MIN_AMOUNT_ERROR');
    }

    if (amount > partner.maxAmount) {
      return failure(`Maximum amount is ${partner.maxAmount} coins`, 'MAX_AMOUNT_ERROR');
    }

    const rewardValue = Math.floor(amount / partner.exchangeRate);

    return success({
      coinsRequired: amount,
      rewardValue,
      exchangeRate: partner.exchangeRate,
    });
  } catch (error) {
    console.error('calculateExchangeRate error:', error);
    return failure('Failed to calculate exchange rate', 'INTERNAL_ERROR');
  }
}

export async function executeExchange(
  userId: string,
  partnerId: string,
  amount: number
): Promise<ServiceResult<ExchangeResult>> {
  try {
    const partner = PARTNERS.find(p => p.id === partnerId);

    if (!partner) {
      return failure('Partner not found', 'NOT_FOUND');
    }

    if (!partner.isActive) {
      return failure('Partner is not available', 'PARTNER_INACTIVE');
    }

    if (amount < partner.minAmount || amount > partner.maxAmount) {
      return failure('Invalid amount', 'INVALID_AMOUNT');
    }

    const walletResult = await sql`
      SELECT balance FROM playcoin_wallets WHERE user_id = ${userId}
    `;

    if (walletResult.rows.length === 0) {
      return failure('Wallet not found', 'WALLET_NOT_FOUND');
    }

    const currentBalance = walletResult.rows[0].balance;
    if (currentBalance < amount) {
      return failure('Insufficient balance', 'INSUFFICIENT_BALANCE');
    }

    const burnResult = await burnCoins(userId, amount, 'partner_exchange', partnerId);
    if (!burnResult.success) {
      return failure(burnResult.error, burnResult.code);
    }

    const rewardValue = Math.floor(amount / partner.exchangeRate);
    const code = generateVoucherCode(partner.id);
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 30);

    const transactionId = burnResult.data.transaction.id;
    const rewardResult = await sql`
      INSERT INTO user_rewards (user_id, reward_id, transaction_id, status, expires_at)
      VALUES (
        ${userId},
        (SELECT id FROM rewards WHERE partner_id = ${partnerId}::uuid LIMIT 1),
        ${transactionId},
        'redeemed',
        ${expiresAt.toISOString()}
      )
      ON CONFLICT DO NOTHING
      RETURNING id
    `;

    return success({
      transactionId,
      partnerId: partner.id,
      partnerName: partner.name,
      coinsSpent: amount,
      rewardValue,
      rewardType: partner.rewardType,
      code,
      expiresAt,
    });
  } catch (error) {
    console.error('executeExchange error:', error);
    return failure('Failed to execute exchange', 'INTERNAL_ERROR');
  }
}

function generateVoucherCode(partnerId: string): string {
  const prefix = partnerId.split('-')[1]?.substring(0, 3).toUpperCase() || 'PMD';
  const random = Math.random().toString(36).substring(2, 10).toUpperCase();
  return `${prefix}-${random}`;
}
