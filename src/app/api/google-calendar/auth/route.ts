import { NextRequest, NextResponse } from 'next/server';

export async function POST(
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  request: NextRequest
) {
  try {
    // サーバーサイドでGoogle OAuth設定を返す
    // APIキーは含めない（OAuth Client IDのみ）
    const response = {
      clientId: process.env.GOOGLE_CLIENT_ID,
      // APIキーはサーバーサイドのみで使用
    };

    return NextResponse.json(response);
  } catch (error) {
    console.error('Failed to get Google auth config:', error);
    return NextResponse.json(
      { error: 'Failed to get authentication configuration' },
      { status: 500 }
    );
  }
}