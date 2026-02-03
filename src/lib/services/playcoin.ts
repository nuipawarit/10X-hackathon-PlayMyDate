import { sql, type PlaycoinWallet, type PlaycoinTransaction } from '@/lib/db';
import { success, failure, type ServiceResult } from './types';

export async function getWallet(userId: string): Promise<ServiceResult<PlaycoinWallet>> {
  try {
    const result = await sql`
      SELECT * FROM playcoin_wallets WHERE user_id = ${userId}
    `;

    if (result.rows.length === 0) {
      const createResult = await sql`
        INSERT INTO playcoin_wallets (user_id, balance, lifetime_earned, lifetime_spent)
        VALUES (${userId}, 0, 0, 0)
        RETURNING *
      `;
      return success(createResult.rows[0] as PlaycoinWallet);
    }

    return success(result.rows[0] as PlaycoinWallet);
  } catch (error) {
    console.error('getWallet error:', error);
    return failure('Failed to get wallet', 'INTERNAL_ERROR');
  }
}

export async function earnCoins(
  userId: string,
  amount: number,
  source: string,
  referenceId?: string
): Promise<ServiceResult<{ wallet: PlaycoinWallet; transaction: PlaycoinTransaction }>> {
  try {
    const walletResult = await getWallet(userId);
    if (!walletResult.success) {
      return failure(walletResult.error, walletResult.code);
    }

    const wallet = walletResult.data;
    const newBalance = wallet.balance + amount;

    const updateResult = await sql`
      UPDATE playcoin_wallets
      SET balance = ${newBalance},
          lifetime_earned = lifetime_earned + ${amount},
          updated_at = NOW()
      WHERE id = ${wallet.id}
      RETURNING *
    `;

    const transactionResult = await sql`
      INSERT INTO playcoin_transactions (wallet_id, type, amount, balance_after, source, reference_id)
      VALUES (${wallet.id}, 'earn', ${amount}, ${newBalance}, ${source}, ${referenceId || null})
      RETURNING *
    `;

    return success({
      wallet: updateResult.rows[0] as PlaycoinWallet,
      transaction: transactionResult.rows[0] as PlaycoinTransaction,
    });
  } catch (error) {
    console.error('earnCoins error:', error);
    return failure('Failed to earn coins', 'INTERNAL_ERROR');
  }
}

export async function burnCoins(
  userId: string,
  amount: number,
  source: string,
  referenceId?: string
): Promise<ServiceResult<{ wallet: PlaycoinWallet; transaction: PlaycoinTransaction }>> {
  try {
    const walletResult = await getWallet(userId);
    if (!walletResult.success) {
      return failure(walletResult.error, walletResult.code);
    }

    const wallet = walletResult.data;
    if (wallet.balance < amount) {
      return failure('Insufficient balance', 'INSUFFICIENT_BALANCE');
    }

    const newBalance = wallet.balance - amount;

    const updateResult = await sql`
      UPDATE playcoin_wallets
      SET balance = ${newBalance},
          lifetime_spent = lifetime_spent + ${amount},
          updated_at = NOW()
      WHERE id = ${wallet.id}
      RETURNING *
    `;

    const transactionResult = await sql`
      INSERT INTO playcoin_transactions (wallet_id, type, amount, balance_after, source, reference_id)
      VALUES (${wallet.id}, 'burn', ${-amount}, ${newBalance}, ${source}, ${referenceId || null})
      RETURNING *
    `;

    return success({
      wallet: updateResult.rows[0] as PlaycoinWallet,
      transaction: transactionResult.rows[0] as PlaycoinTransaction,
    });
  } catch (error) {
    console.error('burnCoins error:', error);
    return failure('Failed to burn coins', 'INTERNAL_ERROR');
  }
}

export async function getTransactionHistory(
  userId: string,
  limit = 20,
  offset = 0
): Promise<ServiceResult<{ transactions: PlaycoinTransaction[]; total: number }>> {
  try {
    const walletResult = await getWallet(userId);
    if (!walletResult.success) {
      return failure(walletResult.error, walletResult.code);
    }

    const wallet = walletResult.data;

    const countResult = await sql`
      SELECT COUNT(*) as total FROM playcoin_transactions WHERE wallet_id = ${wallet.id}
    `;

    const result = await sql`
      SELECT * FROM playcoin_transactions
      WHERE wallet_id = ${wallet.id}
      ORDER BY created_at DESC
      LIMIT ${limit} OFFSET ${offset}
    `;

    return success({
      transactions: result.rows as PlaycoinTransaction[],
      total: parseInt(countResult.rows[0].total as string, 10),
    });
  } catch (error) {
    console.error('getTransactionHistory error:', error);
    return failure('Failed to get transaction history', 'INTERNAL_ERROR');
  }
}
