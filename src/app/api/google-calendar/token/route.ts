import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const { code } = await request.json();

    if (!code) {
      return NextResponse.json({ error: 'Authorization code required' }, { status: 400 });
    }

    const clientId = process.env.GOOGLE_CLIENT_ID;
    const clientSecret = process.env.GOOGLE_CLIENT_SECRET;
    // フォールバック用のリダイレクトURI（カスタムOAuth 2.0フロー用）
    const redirectUri = `http://localhost:3000/auth/callback`;

    if (!clientId || !clientSecret) {
      return NextResponse.json({ error: 'Google OAuth credentials not configured' }, { status: 500 });
    }

    console.log('Token exchange request details:', {
      clientId: clientId,
      redirectUri: redirectUri,
      hasCode: !!code,
      hasClientSecret: !!clientSecret
    });

    // Google OAuth token endpoint にリクエスト
    const tokenResponse = await fetch('https://oauth2.googleapis.com/token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        client_id: clientId,
        client_secret: clientSecret,
        code: code,
        grant_type: 'authorization_code',
        redirect_uri: redirectUri,
      }),
    });

    if (!tokenResponse.ok) {
      const errorData = await tokenResponse.text();
      console.error('Google token exchange failed:', {
        status: tokenResponse.status,
        statusText: tokenResponse.statusText,
        error: errorData,
        requestParams: {
          client_id: clientId,
          redirect_uri: redirectUri,
          grant_type: 'authorization_code'
        }
      });
      return NextResponse.json({ 
        error: 'Token exchange failed', 
        details: errorData,
        status: tokenResponse.status 
      }, { status: 400 });
    }

    const tokenData = await tokenResponse.json();
    
    console.log('Token exchange successful');
    
    // アクセストークンを返す
    return NextResponse.json({
      access_token: tokenData.access_token,
      refresh_token: tokenData.refresh_token,
      expires_in: tokenData.expires_in,
      token_type: tokenData.token_type,
      scope: tokenData.scope
    });

  } catch (error) {
    console.error('Failed to exchange authorization code:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}