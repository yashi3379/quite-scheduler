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
    const { subscription } = await request.json()
    
    // 認証確認（セッションベースの場合は簡略化）
    const authHeader = request.headers.get('Authorization')
    if (!authHeader) {
      return NextResponse.json(
        { error: '認証が必要です' },
        { status: 401 }
      )
    }
    
    // サブスクリプション情報の検証
    if (!subscription || !subscription.endpoint) {
      return NextResponse.json(
        { error: '無効なサブスクリプション情報です' },
        { status: 400 }
      )
    }
    
    // TODO: 実際のデータベース実装でサブスクリプション情報を保存
    // 現在はセッションベースなので、localStorage等での管理を想定
    console.log('Push subscription saved:', {
      endpoint: subscription.endpoint,
      keys: subscription.keys,
      timestamp: new Date().toISOString()
    })
    
    // サブスクリプションが有効かテスト（オプション）
    try {
      const testPayload = {
        title: 'サブスクリプション完了',
        body: '通知の設定が完了しました！',
        icon: '/icon-192x192.svg'
      }
      
      // テスト通知を送信
      await webpush.sendNotification(subscription, JSON.stringify(testPayload))
      console.log('Test notification sent successfully')
      
    } catch (testError) {
      console.error('Test notification failed:', testError)
      // テスト通知の失敗は致命的ではないので、処理を続行
    }
    
    return NextResponse.json({ 
      success: true,
      message: 'プッシュ通知サブスクリプションが登録されました',
      subscriptionInfo: {
        endpoint: subscription.endpoint,
        registered: true
      }
    })
    
  } catch (error) {
    console.error('Subscription error:', error)
    return NextResponse.json(
      { error: 'サブスクリプション登録に失敗しました' },
      { status: 500 }
    )
  }
}