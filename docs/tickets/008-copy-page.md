# チケット #008: 専用コピーページ実装

## 概要
URL経由でアクセス可能なコンテンツコピー専用ページの実装

## 優先度
🔴 高優先度

## 詳細説明
Google Calendarからの通知URLでアクセスし、スケジュールされたコンテンツをワンクリックでコピーできる専用ページを実装する。トークンベース認証とモバイル最適化を含む。

## 実装内容

### 1. データベーススキーマ更新

#### scheduled_postsテーブル拡張
```sql
-- 既存のscheduled_postsテーブルにフィールド追加
ALTER TABLE scheduled_posts 
ADD COLUMN access_token TEXT NOT NULL DEFAULT gen_random_uuid(),
ADD COLUMN copy_status JSONB DEFAULT '{}';

-- アクセストークン用インデックス
CREATE INDEX idx_scheduled_posts_access_token 
ON scheduled_posts(access_token);
```

### 2. コピーページコンポーネント

```typescript
// app/copy/[scheduleId]/page.tsx
import { notFound, redirect } from 'next/navigation';
import { Suspense } from 'react';
import CopyPageContent from '@/components/copy/CopyPageContent';
import { validateAccessToken } from '@/lib/copy';
import LoadingSpinner from '@/components/shared/LoadingSpinner';

interface CopyPageProps {
  params: {
    scheduleId: string;
  };
  searchParams: {
    token?: string;
  };
}

export async function generateMetadata({ params, searchParams }: CopyPageProps) {
  const { scheduleId } = params;
  const { token } = searchParams;

  if (!token) {
    return {
      title: 'Access Required',
      description: 'Valid access token required'
    };
  }

  try {
    const { schedule } = await validateAccessToken(scheduleId, token);
    const contentTitle = schedule.imported_content?.metadata?.title || 'Scheduled Content';
    
    return {
      title: `Copy: ${contentTitle}`,
      description: `Copy content for ${schedule.selected_platforms.join(', ')}`,
    };
  } catch {
    return {
      title: 'Content Not Found',
      description: 'The requested content could not be found'
    };
  }
}

export default async function CopyPage({ params, searchParams }: CopyPageProps) {
  const { scheduleId } = params;
  const { token } = searchParams;

  // トークンが必要
  if (!token) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-lg shadow-lg p-8 max-w-md w-full text-center">
          <div className="text-red-500 text-6xl mb-4">🔒</div>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Access Required</h1>
          <p className="text-gray-600 mb-4">
            A valid access token is required to view this content.
          </p>
          <p className="text-sm text-gray-500">
            Please use the link provided in your calendar notification.
          </p>
        </div>
      </div>
    );
  }

  // トークン検証
  let scheduleData;
  try {
    scheduleData = await validateAccessToken(scheduleId, token);
  } catch (error) {
    notFound();
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Suspense fallback={<LoadingSpinner />}>
        <CopyPageContent 
          schedule={scheduleData.schedule}
          content={scheduleData.content}
        />
      </Suspense>
    </div>
  );
}
```

### 3. メインコピーコンテンツコンポーネント

```typescript
// components/copy/CopyPageContent.tsx
'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/Button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import PlatformContent from '@/components/copy/PlatformContent';
import CopyStatusIndicator from '@/components/copy/CopyStatusIndicator';
import { updateCopyStatus } from '@/lib/copy';

interface CopyPageContentProps {
  schedule: {
    id: string;
    imported_content: any;
    selected_language: string;
    selected_platforms: string[];
    scheduled_time: string;
    copy_status: Record<string, string>;
  };
  content: any;
}

export default function CopyPageContent({ schedule, content }: CopyPageContentProps) {
  const [copyStatus, setCopyStatus] = useState<Record<string, string>>(
    schedule.copy_status || {}
  );
  const [activePlatform, setActivePlatform] = useState<string>(
    schedule.selected_platforms[0]
  );

  const scheduledTime = new Date(schedule.scheduled_time);
  const isPostTime = new Date() >= scheduledTime;

  // 選択された言語のコンテンツを取得
  const languageContent = content.languages[schedule.selected_language];
  const platformContents = languageContent?.platforms || [];

  // 選択されたプラットフォームのコンテンツのみフィルタ
  const availableContents = platformContents.filter((platform: any) =>
    schedule.selected_platforms.includes(platform.platform)
  );

  const handleCopy = async (platform: string, text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      
      // ローカル状態更新
      const newStatus = { ...copyStatus, [platform]: 'copied' };
      setCopyStatus(newStatus);
      
      // サーバー状態更新
      await updateCopyStatus(schedule.id, platform, 'copied');
      
      // 成功通知
      if ('vibrate' in navigator) {
        navigator.vibrate(100);
      }
    } catch (error) {
      console.error('Copy failed:', error);
      alert('コピーに失敗しました。手動でテキストを選択してコピーしてください。');
    }
  };

  const getPlatformIcon = (platform: string) => {
    const icons: Record<string, string> = {
      twitter: '🐦',
      reddit: '📮',
      threads: '🧵',
    };
    return icons[platform] || '📱';
  };

  const getLanguageFlag = (language: string) => {
    return language === 'english' ? '🇺🇸' : '🇯🇵';
  };

  return (
    <div className="container mx-auto px-4 py-6 max-w-4xl">
      {/* Header */}
      <div className="mb-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 mb-2">
              📋 {content.metadata?.title || 'Content Copy'}
            </h1>
            <div className="flex items-center gap-3 text-sm text-gray-600">
              <span className="flex items-center gap-1">
                {getLanguageFlag(schedule.selected_language)}
                {schedule.selected_language === 'english' ? 'English' : '日本語'}
              </span>
              <span>•</span>
              <span className="flex items-center gap-1">
                🕒 {scheduledTime.toLocaleString()}
              </span>
            </div>
          </div>
          
          {isPostTime && (
            <div className="text-right">
              <Badge variant="success" className="mb-2">
                🟢 Post Time
              </Badge>
              <div className="text-xs text-gray-500">
                Ready to post!
              </div>
            </div>
          )}
        </div>

        {/* プラットフォームタブ */}
        <div className="flex gap-2 mb-4">
          {schedule.selected_platforms.map((platform) => (
            <button
              key={platform}
              onClick={() => setActivePlatform(platform)}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-all ${
                activePlatform === platform
                  ? 'bg-blue-600 text-white shadow-lg'
                  : 'bg-white text-gray-600 border border-gray-200 hover:border-gray-300'
              }`}
            >
              <span>{getPlatformIcon(platform)}</span>
              <span className="capitalize">{platform}</span>
              <CopyStatusIndicator status={copyStatus[platform]} />
            </button>
          ))}
        </div>
      </div>

      {/* メインコンテンツ */}
      <div className="space-y-6">
        {availableContents
          .filter((platform: any) => platform.platform === activePlatform)
          .map((platform: any, index: number) => (
            <PlatformContent
              key={`${platform.platform}-${index}`}
              platform={platform}
              onCopy={handleCopy}
              copyStatus={copyStatus[platform.platform]}
            />
          ))}
      </div>

      {/* フッター情報 */}
      <div className="mt-8 pt-6 border-t border-gray-200">
        <div className="flex flex-col sm:flex-row gap-4 justify-between items-start">
          <div className="text-sm text-gray-500">
            <p>💡 タップしてコンテンツをコピー</p>
            <p>🔄 コピー後は各プラットフォームに貼り付けてください</p>
          </div>
          
          <div className="text-xs text-gray-400">
            <p>Content ID: {content.content_id}</p>
            <p>Generated: {new Date(content.created_at).toLocaleString()}</p>
          </div>
        </div>
      </div>
    </div>
  );
}
```

### 4. プラットフォーム別コンテンツコンポーネント

```typescript
// components/copy/PlatformContent.tsx
'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/Button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';

interface PlatformContentProps {
  platform: {
    platform: string;
    content: string;
    metadata: {
      finalLength: number;
      tokens?: number;
    };
  };
  onCopy: (platform: string, content: string) => Promise<void>;
  copyStatus?: string;
}

export default function PlatformContent({ platform, onCopy, copyStatus }: PlatformContentProps) {
  const [isLoading, setIsLoading] = useState(false);

  const handleCopy = async () => {
    setIsLoading(true);
    try {
      await onCopy(platform.platform, platform.content);
    } finally {
      setIsLoading(false);
    }
  };

  const getPlatformName = (platformKey: string) => {
    const names: Record<string, string> = {
      twitter: 'Twitter',
      reddit: 'Reddit',
      threads: 'Threads',
    };
    return names[platformKey] || platformKey;
  };

  const getPlatformColor = (platformKey: string) => {
    const colors: Record<string, string> = {
      twitter: 'bg-blue-500',
      reddit: 'bg-orange-500',
      threads: 'bg-black',
    };
    return colors[platformKey] || 'bg-gray-500';
  };

  const getCharacterLimit = (platformKey: string) => {
    const limits: Record<string, number> = {
      twitter: 280,
      reddit: 40000,
      threads: 500,
    };
    return limits[platformKey];
  };

  const characterLimit = getCharacterLimit(platform.platform);
  const isOverLimit = platform.metadata.finalLength > characterLimit;

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className={`w-3 h-3 rounded-full ${getPlatformColor(platform.platform)}`} />
            <span>{getPlatformName(platform.platform)}</span>
          </div>
          
          <div className="flex items-center gap-2">
            <Badge 
              variant={isOverLimit ? "danger" : "secondary"}
              className="text-xs"
            >
              {platform.metadata.finalLength}/{characterLimit}
            </Badge>
            {copyStatus === 'copied' && (
              <Badge variant="success" className="text-xs">
                ✓ Copied
              </Badge>
            )}
          </div>
        </CardTitle>
      </CardHeader>
      
      <CardContent className="space-y-4">
        {/* コンテンツプレビュー */}
        <div 
          className={`relative bg-gray-50 rounded-lg p-4 border-2 transition-all cursor-pointer hover:border-blue-300 ${
            copyStatus === 'copied' ? 'border-green-300 bg-green-50' : 'border-gray-200'
          }`}
          onClick={handleCopy}
        >
          <div className="absolute top-2 right-2">
            {copyStatus === 'copied' ? (
              <span className="text-green-600 text-xl">✓</span>
            ) : (
              <span className="text-gray-400 text-xl">📋</span>
            )}
          </div>
          
          <pre className="whitespace-pre-wrap font-sans text-sm text-gray-800 pr-8">
            {platform.content}
          </pre>
          
          {isOverLimit && (
            <div className="mt-2 text-xs text-red-600 bg-red-50 rounded p-2">
              ⚠️ Content exceeds {getPlatformName(platform.platform)} character limit
            </div>
          )}
        </div>

        {/* コピーボタン */}
        <Button
          onClick={handleCopy}
          loading={isLoading}
          className={`w-full ${
            copyStatus === 'copied'
              ? 'bg-green-600 hover:bg-green-700'
              : 'bg-blue-600 hover:bg-blue-700'
          }`}
          size="lg"
        >
          {copyStatus === 'copied' ? (
            <>
              <span>✓</span>
              <span>Copied to Clipboard</span>
            </>
          ) : (
            <>
              <span>📋</span>
              <span>Copy to Clipboard</span>
            </>
          )}
        </Button>

        {/* メタデータ */}
        <div className="flex justify-between text-xs text-gray-500 pt-2 border-t border-gray-200">
          <span>Characters: {platform.metadata.finalLength}</span>
          {platform.metadata.tokens && (
            <span>Tokens: {platform.metadata.tokens}</span>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
```

### 5. コピーステータス表示コンポーネント

```typescript
// components/copy/CopyStatusIndicator.tsx
interface CopyStatusIndicatorProps {
  status?: string;
}

export default function CopyStatusIndicator({ status }: CopyStatusIndicatorProps) {
  if (!status) return null;

  const statusConfig = {
    copied: {
      icon: '✓',
      color: 'text-green-600',
      bg: 'bg-green-100',
    },
    pending: {
      icon: '⏳',
      color: 'text-yellow-600',
      bg: 'bg-yellow-100',
    },
  };

  const config = statusConfig[status as keyof typeof statusConfig];
  if (!config) return null;

  return (
    <span className={`inline-flex items-center justify-center w-5 h-5 rounded-full text-xs ${config.bg} ${config.color}`}>
      {config.icon}
    </span>
  );
}
```

### 6. バックエンドユーティリティ関数

```typescript
// lib/copy.ts
import { supabase } from '@/lib/supabase';

export interface ScheduleWithContent {
  schedule: {
    id: string;
    imported_content: any;
    selected_language: string;
    selected_platforms: string[];
    scheduled_time: string;
    copy_status: Record<string, string>;
  };
  content: any;
}

export async function validateAccessToken(
  scheduleId: string, 
  token: string
): Promise<ScheduleWithContent> {
  // スケジュールとアクセストークンを検証
  const { data: schedule, error: scheduleError } = await supabase
    .from('scheduled_posts')
    .select(`
      id,
      imported_content,
      selected_language,
      selected_platforms,
      scheduled_time,
      copy_status,
      access_token
    `)
    .eq('id', scheduleId)
    .eq('access_token', token)
    .single();

  if (scheduleError || !schedule) {
    throw new Error('Invalid access token or schedule not found');
  }

  return {
    schedule,
    content: schedule.imported_content
  };
}

export async function updateCopyStatus(
  scheduleId: string,
  platform: string,
  status: string
): Promise<void> {
  // 現在のコピーステータスを取得
  const { data: currentSchedule } = await supabase
    .from('scheduled_posts')
    .select('copy_status')
    .eq('id', scheduleId)
    .single();

  const currentStatus = currentSchedule?.copy_status || {};
  const updatedStatus = {
    ...currentStatus,
    [platform]: status,
    [`${platform}_copied_at`]: new Date().toISOString()
  };

  // ステータス更新
  const { error } = await supabase
    .from('scheduled_posts')
    .update({
      copy_status: updatedStatus,
      updated_at: new Date().toISOString()
    })
    .eq('id', scheduleId);

  if (error) {
    throw new Error('Failed to update copy status');
  }
}

export async function generateAccessURL(scheduleId: string): Promise<string> {
  // スケジュールからアクセストークンを取得
  const { data: schedule, error } = await supabase
    .from('scheduled_posts')
    .select('access_token')
    .eq('id', scheduleId)
    .single();

  if (error || !schedule) {
    throw new Error('Schedule not found');
  }

  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000';
  return `${baseUrl}/copy/${scheduleId}?token=${schedule.access_token}`;
}
```

### 7. API Routes

```typescript
// app/api/copy/[scheduleId]/status/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { updateCopyStatus } from '@/lib/copy';

export async function POST(
  request: NextRequest,
  { params }: { params: { scheduleId: string } }
) {
  try {
    const { platform, status } = await request.json();
    
    await updateCopyStatus(params.scheduleId, platform, status);
    
    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to update copy status' },
      { status: 500 }
    );
  }
}
```

## 完了条件
- [ ] データベーススキーマが更新済み（ローカル実装のみ、DB実装は将来対応）
- [x] トークンベース認証が実装済み
- [x] コピーページコンポーネントが実装済み
- [x] プラットフォーム別コンテンツ表示が実装済み
- [x] ワンクリックコピー機能が実装済み
- [x] コピーステータス追跡が実装済み
- [x] モバイル最適化が実装済み
- [x] エラーハンドリングが実装済み
- [x] アクセストークン検証が実装済み

## 関連ファイル
- `app/copy/[scheduleId]/page.tsx`
- `components/copy/CopyPageContent.tsx`
- `components/copy/PlatformContent.tsx`
- `components/copy/CopyStatusIndicator.tsx`
- `lib/copy.ts`
- `app/api/copy/[scheduleId]/status/route.ts`

## 見積もり時間
6-7時間

## 注意事項
- セキュリティ: アクセストークンの適切な検証
- UX: モバイル環境でのタップしやすさ
- エラーハンドリング: 無効なトークン・期限切れ対応
- パフォーマンス: コンテンツプレビューの最適化
- アクセシビリティ: スクリーンリーダー対応