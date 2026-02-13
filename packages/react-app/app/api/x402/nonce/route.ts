import { NextRequest, NextResponse } from 'next/server';
import { getNonce } from '@/agents/x402/facilitator';

export async function GET(request: NextRequest) {
    const address = request.nextUrl.searchParams.get('address');

    if (!address) {
        return NextResponse.json({ error: 'Address required' }, { status: 400 });
    }

    try {
        const nonce = await getNonce(address);
        return NextResponse.json({ nonce: nonce.toString() });
    } catch (error) {
        console.error('Nonce fetch error:', error);
        return NextResponse.json(
            { error: 'Failed to fetch nonce' },
            { status: 500 }
        );
    }
}
