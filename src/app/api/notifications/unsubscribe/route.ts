import { NextRequest, NextResponse } from 'next/server'

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
    
    // TODO: 実際のデータベース実装
    // サブスクリプション情報を削除
    console.log('Push subscription removed:', {
      timestamp: new Date().toISOString()
    })
    
    return NextResponse.json({ 
      success: true,
      message: 'プッシュ通知サブスクリプションが解除されました'
    })
    
  } catch (error) {
    console.error('Unsubscribe error:', error)
    return NextResponse.json(
      { error: 'サブスクリプション解除に失敗しました' },
      { status: 500 }
    )
  }
}