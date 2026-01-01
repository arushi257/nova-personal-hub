import { NextRequest, NextResponse } from 'next/server';
import { getServices, performServiceAction } from '../data';
import { ServiceAction } from '@/lib/nexus/types';

export async function GET() {
  return NextResponse.json({ services: getServices() });
}

export async function POST(request: NextRequest) {
  const body = await request.json().catch(() => null);
  const id = body?.id as string | undefined;
  const action = body?.action as ServiceAction | undefined;

  if (!id || !action) {
    return NextResponse.json({ error: 'id and action are required' }, { status: 400 });
  }

  try {
    const service = performServiceAction(id, action);
    return NextResponse.json({ service });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json({ error: message }, { status: 404 });
  }
}

