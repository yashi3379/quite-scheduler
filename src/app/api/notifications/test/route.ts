import { NextRequest, NextResponse } from 'next/server'
// eslint-disable-next-line @typescript-eslint/no-explicit-any, @typescript-eslint/no-require-imports
const webpush = require('web-push') as any

// VAPID設定
webpush.setVapidDetails(
  'mailto:' + process.env.VAPID_EMAIL,
  process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY!,
  process.env.VAPID_PRIVATE_KEY!
)

export async function POST(request: NextRequest) {
  try {
    // 認証確認
    const authHeader = request.headers.get('Authorization')
    if (!authHeader) {
      return NextResponse.json(
        { error: '認証が必要です' },
        { status: 401 }
      )
    }
    
    // TODO: 実際の実装では、ユーザーのサブスクリプション情報を取得
    // 現在はテスト用のダミー通知
    const notificationPayload = {
      title: 'Quite Scheduler テスト通知',
      body: 'これはテスト通知です。通知機能が正常に動作しています！',
      icon: '/icon-192x192.svg',
      badge: '/icon-192x192.svg',
      data: {
        url: '/',
        timestamp: new Date().toISOString()
      }
    }
    
    console.log('Test notification configured:', notificationPayload)
    
    // 実際のプッシュ通知を送信するには、ユーザーのサブスクリプション情報が必要
    // サブスクリプション情報の例：
    // await webpush.sendNotification(subscription, JSON.stringify(notificationPayload))
    
    return NextResponse.json({ 
      success: true,
      message: 'テスト通知が設定されました（実際の送信にはサブスクリプション情報が必要です）',
      payload: notificationPayload
    })
    
  } catch (error) {
    console.error('Test notification error:', error)
    return NextResponse.json(
      { error: 'テスト通知の送信に失敗しました' },
      { status: 500 }
    )
  }
}