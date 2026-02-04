import { NextRequest, NextResponse } from 'next/server';
import { withB2BAuth } from '@/lib/api-auth-b2b';
import { getQuestsForCampaign, createBrandedQuest } from '@/lib/services/quest';
import { sql } from '@/lib/db';

export async function GET(request: NextRequest) {
  return withB2BAuth(request, async (merchantId) => {
    const { searchParams } = new URL(request.url);
    const campaignId = searchParams.get('campaignId');

    if (!campaignId) {
      const result = await sql`
        SELECT bq.* FROM branded_quests bq
        JOIN campaigns c ON bq.campaign_id = c.id
        WHERE c.merchant_id = ${merchantId}
        ORDER BY bq.created_at DESC
      `;

      return NextResponse.json({ quests: result.rows });
    }

    const campaignCheck = await sql`
      SELECT id FROM campaigns WHERE id = ${campaignId} AND merchant_id = ${merchantId}
    `;

    if (campaignCheck.rows.length === 0) {
      return NextResponse.json({ error: 'Campaign not found' }, { status: 404 });
    }

    const result = await getQuestsForCampaign(campaignId);

    if (!result.success) {
      return NextResponse.json({ error: result.error }, { status: 500 });
    }

    return NextResponse.json({ quests: result.data });
  });
}

export async function POST(request: NextRequest) {
  return withB2BAuth(request, async (merchantId) => {
    const body = await request.json();

    if (!body.campaignId || !body.activityId || !body.name) {
      return NextResponse.json(
        { error: 'campaignId, activityId, and name are required' },
        { status: 400 }
      );
    }

    const campaignCheck = await sql`
      SELECT id FROM campaigns WHERE id = ${body.campaignId} AND merchant_id = ${merchantId}
    `;

    if (campaignCheck.rows.length === 0) {
      return NextResponse.json({ error: 'Campaign not found' }, { status: 404 });
    }

    const result = await createBrandedQuest(body.campaignId, {
      activityId: body.activityId,
      name: body.name,
      description: body.description,
      instructions: body.instructions,
      coinReward: body.coinReward,
      voucherRewardId: body.voucherRewardId,
      maxCompletions: body.maxCompletions,
    });

    if (!result.success) {
      const status = result.code === 'NOT_FOUND' ? 404 : 500;
      return NextResponse.json({ error: result.error }, { status });
    }

    return NextResponse.json({ quest: result.data }, { status: 201 });
  });
}
