import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  try {
    const { password } = await request.json();
    const expectedPassword = process.env.DEMO_PASSWORD || 'MetricLabDemo2026';

    if (password === expectedPassword) {
      return NextResponse.json({ ok: true });
    }

    return NextResponse.json({ ok: false, error: 'Senha incorreta' }, { status: 401 });
  } catch {
    return NextResponse.json({ ok: false, error: 'Requisição inválida' }, { status: 400 });
  }
}
