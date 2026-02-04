import { sql } from '@/lib/db';
import { success, failure, type ServiceResult } from './types';
import { hashPassword } from '@/lib/auth';
import crypto from 'crypto';

export interface Merchant {
  id: string;
  name: string;
  business_type: string;
  description: string | null;
  contact_email: string;
  contact_phone: string | null;
  address: string | null;
  logo_url: string | null;
  status: string;
  tier: string;
  api_key: string | null;
  metadata: Record<string, unknown> | null;
  created_at: Date;
  updated_at: Date;
}

export interface MerchantUser {
  id: string;
  merchant_id: string;
  email: string;
  display_name: string | null;
  role: string;
  permissions: string[] | null;
  is_active: boolean;
  created_at: Date;
  updated_at: Date;
}

export interface CreateMerchantInput {
  name: string;
  businessType: string;
  description?: string;
  contactEmail: string;
  contactPhone?: string;
  address?: string;
  logoUrl?: string;
}

export interface CreateMerchantUserInput {
  email: string;
  password: string;
  displayName?: string;
  role?: string;
}

export async function createMerchant(data: CreateMerchantInput): Promise<ServiceResult<Merchant>> {
  try {
    const existingResult = await sql`
      SELECT id FROM merchants WHERE contact_email = ${data.contactEmail}
    `;

    if (existingResult.rows.length > 0) {
      return failure('Merchant with this email already exists', 'DUPLICATE_EMAIL');
    }

    const result = await sql`
      INSERT INTO merchants (
        name, business_type, description, contact_email, contact_phone,
        address, logo_url, status, tier
      )
      VALUES (
        ${data.name}, ${data.businessType}, ${data.description ?? null},
        ${data.contactEmail}, ${data.contactPhone ?? null},
        ${data.address ?? null}, ${data.logoUrl ?? null}, 'pending', 'basic'
      )
      RETURNING *
    `;

    return success(result.rows[0] as Merchant);
  } catch (error) {
    console.error('createMerchant error:', error);
    return failure('Failed to create merchant', 'INTERNAL_ERROR');
  }
}

export async function getMerchantById(merchantId: string): Promise<ServiceResult<Merchant>> {
  try {
    const result = await sql`
      SELECT * FROM merchants WHERE id = ${merchantId}
    `;

    if (result.rows.length === 0) {
      return failure('Merchant not found', 'NOT_FOUND');
    }

    return success(result.rows[0] as Merchant);
  } catch (error) {
    console.error('getMerchantById error:', error);
    return failure('Failed to get merchant', 'INTERNAL_ERROR');
  }
}

export async function updateMerchant(
  merchantId: string,
  data: Partial<CreateMerchantInput>
): Promise<ServiceResult<Merchant>> {
  try {
    const result = await sql`
      UPDATE merchants
      SET
        name = COALESCE(${data.name ?? null}, name),
        business_type = COALESCE(${data.businessType ?? null}, business_type),
        description = COALESCE(${data.description ?? null}, description),
        contact_email = COALESCE(${data.contactEmail ?? null}, contact_email),
        contact_phone = COALESCE(${data.contactPhone ?? null}, contact_phone),
        address = COALESCE(${data.address ?? null}, address),
        logo_url = COALESCE(${data.logoUrl ?? null}, logo_url),
        updated_at = NOW()
      WHERE id = ${merchantId}
      RETURNING *
    `;

    if (result.rows.length === 0) {
      return failure('Merchant not found', 'NOT_FOUND');
    }

    return success(result.rows[0] as Merchant);
  } catch (error) {
    console.error('updateMerchant error:', error);
    return failure('Failed to update merchant', 'INTERNAL_ERROR');
  }
}

export async function createMerchantUser(
  merchantId: string,
  data: CreateMerchantUserInput
): Promise<ServiceResult<MerchantUser>> {
  try {
    const existingResult = await sql`
      SELECT id FROM merchant_users WHERE email = ${data.email}
    `;

    if (existingResult.rows.length > 0) {
      return failure('User with this email already exists', 'DUPLICATE_EMAIL');
    }

    const passwordHash = await hashPassword(data.password);

    const result = await sql`
      INSERT INTO merchant_users (merchant_id, email, password_hash, display_name, role)
      VALUES (${merchantId}, ${data.email}, ${passwordHash}, ${data.displayName ?? null}, ${data.role ?? 'staff'})
      RETURNING id, merchant_id, email, display_name, role, permissions, is_active, created_at, updated_at
    `;

    return success(result.rows[0] as MerchantUser);
  } catch (error) {
    console.error('createMerchantUser error:', error);
    return failure('Failed to create merchant user', 'INTERNAL_ERROR');
  }
}

export async function generateAPIKey(merchantId: string): Promise<ServiceResult<{ apiKey: string }>> {
  try {
    const merchantResult = await sql`
      SELECT id, status FROM merchants WHERE id = ${merchantId}
    `;

    if (merchantResult.rows.length === 0) {
      return failure('Merchant not found', 'NOT_FOUND');
    }

    const apiKey = `api_${crypto.randomBytes(32).toString('hex')}`;

    await sql`
      UPDATE merchants SET api_key = ${apiKey}, updated_at = NOW()
      WHERE id = ${merchantId}
    `;

    return success({ apiKey });
  } catch (error) {
    console.error('generateAPIKey error:', error);
    return failure('Failed to generate API key', 'INTERNAL_ERROR');
  }
}

export async function getMerchantUsers(merchantId: string): Promise<ServiceResult<MerchantUser[]>> {
  try {
    const result = await sql`
      SELECT id, merchant_id, email, display_name, role, permissions, is_active, created_at, updated_at
      FROM merchant_users
      WHERE merchant_id = ${merchantId}
      ORDER BY created_at DESC
    `;

    return success(result.rows as MerchantUser[]);
  } catch (error) {
    console.error('getMerchantUsers error:', error);
    return failure('Failed to get merchant users', 'INTERNAL_ERROR');
  }
}
