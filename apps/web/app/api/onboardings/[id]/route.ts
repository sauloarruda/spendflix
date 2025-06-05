import { NextResponse } from 'next/server';

import { getOnboardingAction } from '@/actions/onboarding';

export async function GET(request: Request, context: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await context.params;
    const onboarding = await getOnboardingAction(id);
    if (!onboarding || !onboarding.data) {
      return NextResponse.json({ error: 'Onboarding not found' }, { status: 404 });
    }

    const response = NextResponse.json(onboarding, {
      headers: {
        'Cache-Control': 'public, max-age=60, stale-while-revalidate=300', // 1 min cache, 5 min SWR
        'Last-Modified': new Date(onboarding.updatedAt).toISOString(),
      },
    });

    return response;
  } catch {
    return NextResponse.json({ error: 'Failed to fetch onboarding' }, { status: 500 });
  }
}
