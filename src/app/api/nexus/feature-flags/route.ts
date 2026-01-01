import { NextRequest, NextResponse } from 'next/server';
import { getFeatureFlags, toggleFeatureFlag } from '../data';

export async function GET() {
  return NextResponse.json({ flags: getFeatureFlags() });
}

export async function PATCH(request: NextRequest) {
  const body = await request.json().catch(() => null);
  const key = body?.key as string | undefined;
  const enabled = body?.enabled as boolean | undefined;

  if (!key || typeof enabled !== 'boolean') {
    return NextResponse.json({ error: 'key and enabled are required' }, { status: 400 });
  }

  try {
    const flag = toggleFeatureFlag(key, enabled);
    return NextResponse.json({ flag });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json({ error: message }, { status: 404 });
  }
}

