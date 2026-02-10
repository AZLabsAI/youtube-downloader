import { NextRequest, NextResponse } from 'next/server';
import { potProviderService } from '@/services/pot-provider.service';

export async function GET(request: NextRequest) {
  try {
    const health = await potProviderService.getHealth();

    return NextResponse.json(health, {
      status: health.status === 'healthy' ? 200 : 503,
    });
  } catch (error) {
    return NextResponse.json(
      { status: 'unhealthy', error: 'Failed to check health' },
      { status: 503 },
    );
  }
}
