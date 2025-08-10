import { NextRequest, NextResponse } from 'next/server'
import { updateCopyStatus } from '@/lib/copy'

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ scheduleId: string }> }
) {
  try {
    const { scheduleId } = await params
    const { platform, status } = await request.json()
    
    // 入力検証
    if (!platform || !status) {
      return NextResponse.json(
        { error: 'Platform and status are required' },
        { status: 400 }
      )
    }

    if (!['copied', 'pending', 'failed'].includes(status)) {
      return NextResponse.json(
        { error: 'Invalid status. Must be: copied, pending, or failed' },
        { status: 400 }
      )
    }

    // コピーステータス更新
    await updateCopyStatus(scheduleId, platform, status)
    
    return NextResponse.json({ 
      success: true,
      message: `Copy status updated for ${platform}: ${status}`
    })
    
  } catch (error) {
    console.error('Copy status update failed:', error)
    return NextResponse.json(
      { error: 'Failed to update copy status' },
      { status: 500 }
    )
  }
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ scheduleId: string }> }
) {
  try {
    const { scheduleId } = await params
    
    // TODO: データベース実装時に実際のステータスを取得
    // 現在はローカルストレージから取得
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const statusKey = `copy_status_${scheduleId}`
    
    return NextResponse.json({ 
      success: true,
      scheduleId,
      copyStatus: {}, // 実装時に実際のデータを返す
      message: 'Copy status retrieved (mock implementation)'
    })
    
  } catch (error) {
    console.error('Copy status retrieval failed:', error)
    return NextResponse.json(
      { error: 'Failed to retrieve copy status' },
      { status: 500 }
    )
  }
}