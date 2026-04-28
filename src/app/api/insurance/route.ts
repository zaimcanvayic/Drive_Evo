import { NextRequest, NextResponse } from 'next/server';

const PYTHON_API = process.env.PYTHON_API_URL || 'http://localhost:8000';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const res = await fetch(`${PYTHON_API}/insurance`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });

    if (!res.ok) {
      const err = await res.text();
      return NextResponse.json({ error: err }, { status: res.status });
    }

    const data = await res.json();
    return NextResponse.json(data);
  } catch (error) {
    console.error('[/api/insurance] Hata:', error);
    return NextResponse.json(
      { error: 'Python backend bağlantı hatası. Backend çalışıyor mu?' },
      { status: 503 }
    );
  }
}
