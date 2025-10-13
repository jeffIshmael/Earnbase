// app/api/pimlico/route.ts
import { NextResponse, NextRequest } from 'next/server';

export async function POST(req: NextRequest) {
  // Authenticate the request
  if (req.headers.get("authorization") !== `Bearer ${process.env.EARNBASE_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await req.json();
  const res = await fetch(`https://api.pimlico.io/v2/42220/rpc?apikey=${process.env.PIMLICO_API_KEY}`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(body),
  });

  const data = await res.json();
  return NextResponse.json(data);
}
