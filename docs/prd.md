# Next.js版 SNSコンテンツ制作・予約投稿アプリ MVP PRD

## プロジェクト概要

### プロダクト名
**SocialCraft** - SNSコンテンツ投稿スケジューリングプラットフォーム

### 開発背景
bolt newでプロトタイプを制作し、ユーザーフィードバックを得た後、本格的なプロダクションレベルのアプリケーションとしてNext.jsで再構築する。

### 目的
- 外部で作成されたSNSコンテンツの効率的なスケジューリング・投稿管理
- 個人開発者・小規模事業者向けのSNSマーケティング効率化ツール
- シンプルで使いやすいワークフロー: JSONインポート → スケジューリング → 通知 → コピー投稿

### コアワークフロー
1. **JSONインポート**: 外部で作成されたコンテンツ（quite-post形式）をインポート
2. **投稿日時選択**: カレンダーから投稿日時を選択
3. **Google Calendar連携**: 投稿リマインダーとして専用URLをカレンダーに登録
4. **Web Push通知**: 30分前・10分前・直前に通知
5. **コンテンツコピー**: カレンダーのURLからアクセスしてワンクリックでコンテンツをコピー

## 技術仕様

### 技術スタック
- **フロントエンド**: Next.js 15 (App Router)
- **言語**: TypeScript
- **スタイリング**: Tailwind CSS
- **国際化**: next-intl (IPアドレスベース言語自動設定)
- **データベース**: Supabase (PostgreSQL)
- **認証**: Supabase Auth
- **外部API**: Google Calendar API
- **インフラ**: Vercel
- **状態管理**: Jotai
- **通知**: Web Push API
- **AI機能**: Google Gemini 2.0 Flash Lite (Phase 2で最適時間提案用)

### アーキテクチャ
```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│  Welcome        │    │  Import         │    │  Schedule       │
│  Page           │────│  & Preview      │────│  Management     │
│  (多言語対応)    │    │  (JSON処理)     │    │  (カレンダー)    │
└─────────────────┘    └─────────────────┘    └─────────────────┘
        │                       │                       │
        └───────────────────────┴───────────────────────┘
                                │
                    ┌─────────────────┐
                    │  Copy Page      │
                    │  (/copy/[id])   │
                    │  (URL経由)      │
                    └─────────────────┘
                                │
                    ┌─────────────────┐
                    │  Shared         │
                    │  - Database     │
                    │  - Auth         │
                    │  - Components   │
                    │  - Notifications│
                    └─────────────────┘
```

## MVP機能要件

### Phase 1: 基本スケジューリング機能

#### 1. Welcome・多言語対応機能
**ページ**: `/` (ルートページ)

**機能詳細**:
- next-intlによるIPアドレスベース言語自動設定
- 手動言語切り替え機能（日本語・英語）
- アプリの使い方説明
- JSONファイルサンプルダウンロード
- 始めるボタン（認証フローへ）

**実装技術**:
```typescript
// next.config.js
const withNextIntl = require('next-intl/plugin')()

module.exports = withNextIntl({
  i18n: {
    locales: ['en', 'ja'],
    defaultLocale: 'en',
    localeDetection: true, // IPアドレスベース検出
  },
})
```

#### 2. JSONインポート機能
**ページ**: `/import`

**機能詳細**:
- JSONペースト入力エリア
- ファイルアップロード
- JSON検証・エラーハンドリング
- インポートコンテンツプレビュー

#### 3. 基本スケジューリング機能
**ページ**: `/schedule`

**機能詳細**:
- インポートコンテンツの言語・プラットフォーム選択
- 日時選択（カレンダーUI）
- 専用アクセスURL生成
- Google Calendar連携（URLを含むイベント作成）
- タイムゾーン対応

**実装の流れ**:
1. ユーザーが投稿日時を選択
2. システムが一意のアクセスURL生成: `/copy/[scheduleId]?token=[accessToken]`
3. Google Calendarにイベント作成（URLを説明文に記載）
4. 通知スケジュール設定

**Google Calendarイベント例**:
```typescript
const calendarEvent = {
  summary: `Post to ${selectedPlatforms.join(', ')}`,
  description: `投稿用コンテンツ: ${process.env.NEXT_PUBLIC_BASE_URL}/copy/${scheduleId}?token=${accessToken}`,
  start: { dateTime: scheduledTime },
  end: { dateTime: new Date(scheduledTime + 30*60*1000).toISOString() },
  reminders: {
    overrides: [
      { method: 'popup', minutes: 30 },
      { method: 'popup', minutes: 10 }
    ]
  }
}
```

#### 4. 専用コピーページ
**ページ**: `/copy/[scheduleId]`

**機能詳細**:
- URLパラメータ・トークンによるアクセス認証
- スケジュールされたコンテンツの表示
- プラットフォーム別タブ表示
- ワンクリックコピー機能（クリップボードAPI）
- モバイル最適化（カレンダーアプリからの遷移対応）
- コピー完了ステータス更新

**実装例**:
```typescript
// app/copy/[scheduleId]/page.tsx
export default function CopyPage({ params, searchParams }) {
  const { scheduleId } = params
  const { token } = searchParams
  
  // トークン検証とコンテンツ取得
  const { schedule, content } = await validateAndGetContent(scheduleId, token)
  
  const handleCopy = async (platformContent: string) => {
    await navigator.clipboard.writeText(platformContent)
    // コピー完了をDBに記録
    await updateCopyStatus(scheduleId, platform, 'copied')
  }
  
  return (
    <div className="min-h-screen bg-gray-50 p-4">
      <div className="max-w-2xl mx-auto">
        <h1>投稿用コンテンツ</h1>
        {/* プラットフォーム別コンテンツ表示 */}
        {/* ワンクリックコピーボタン */}
      </div>
    </div>
  )
}
```

#### 5. 通知システム
**機能詳細**:
- 30分前・10分前・直前の3段階通知
- Web Push API
- 通知からコピーページへの直接リンク

### Phase 2: AI機能拡張（将来実装）

#### AI最適時間提案機能
**説明**: Phase 1で基本スケジューリングが完成した後、AI機能を追加
- Gemini API連携
- コンテンツ分析による最適時間提案
- エンゲージメント予測
- プラットフォーム別最適化提案

### 共通機能

#### 1. セッション管理（MVP版）
- ローカルストレージベースのセッションID
- 30日間のデータ保持
- 自動クリーンアップ機能
- 将来的な認証システムへの移行対応

#### 2. アプリ設定
**ページ**: `/settings`
- 言語設定（next-intl連携）
- タイムゾーン設定
- 通知設定
- Google Calendar連携設定

#### 3. ダッシュボード
**ページ**: `/dashboard`
- 最近のインポートコンテンツ
- 予定されている投稿
- 投稿履歴・統計
- クイックアクション（インポート・スケジュール）

## データベース設計

### Supabaseテーブル設計

#### users
```sql
CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT UNIQUE NOT NULL,
  display_name TEXT,
  avatar_url TEXT,
  timezone TEXT DEFAULT 'UTC',
  language TEXT DEFAULT 'en',
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);
```

#### imported_content
```sql
CREATE TABLE imported_content (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  original_filename TEXT,
  content JSONB NOT NULL,
  content_id TEXT NOT NULL,
  title TEXT,
  tags TEXT[],
  is_favorite BOOLEAN DEFAULT false,
  created_at TIMESTAMP DEFAULT NOW()
);
```

#### scheduled_posts
```sql
CREATE TABLE scheduled_posts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  content_id UUID REFERENCES imported_content(id),
  imported_content JSONB NOT NULL,
  selected_language TEXT NOT NULL,
  selected_platforms TEXT[] NOT NULL,
  scheduled_time TIMESTAMP NOT NULL,
  status TEXT DEFAULT 'scheduled',
  calendar_event_id TEXT,
  access_token TEXT NOT NULL, -- コピーページアクセス用トークン
  copy_status JSONB DEFAULT '{}', -- プラットフォーム別コピー状況
  notifications_sent TEXT[] DEFAULT ARRAY[]::TEXT[],
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);
```

#### user_settings
```sql
CREATE TABLE user_settings (
  user_id UUID PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
  notification_settings JSONB DEFAULT '{}',
  calendar_integration BOOLEAN DEFAULT false,
  language_preference TEXT DEFAULT 'auto', -- 'auto', 'en', 'ja'
  timezone TEXT DEFAULT 'UTC',
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);
```

## UI/UX設計

### デザインシステム
- **色彩**: 
  - プライマリ: Blue-600 (#2563eb)
  - セカンダリ: Gray-600 (#4b5563)
  - アクセント: Green-500（成功）、Red-500（エラー）
- **タイポグラフィ**: Inter フォント
- **コンポーネント**: カスタムTailwind CSS コンポーネント
- **レスポンシブ**: モバイルファースト
- **ダークモード**: system/light/dark 切り替え対応

### ナビゲーション構成
```
Header
├── Logo
├── Language Switcher (🌐)
├── Navigation
│   ├── Import (/import)
│   ├── Schedule (/schedule)
│   ├── History (/history)
│   └── Settings (/settings)
└── User Menu
    ├── Dashboard
    ├── Profile
    └── Logout

Sidebar (Desktop)
├── Quick Actions
├── Recent Imports
└── Upcoming Posts
```

### 主要ページ設計

#### `/` - Welcome Page
```
┌─────────────────────────────────┐
│ 🌐 Language Switcher            │
├─────────────────────────────────┤
│ Welcome to SocialCraft          │
│ SNS投稿スケジューリング         │
├─────────────────────────────────┤
│ 使い方:                         │
│ 1. JSONファイルをインポート     │
│ 2. 投稿日時をスケジュール       │
│ 3. カレンダー通知で投稿         │
├─────────────────────────────────┤
│ [Sample JSON Download] 📥       │
│ [Get Started] 🚀               │
└─────────────────────────────────┘
```

#### `/import` - JSONインポート
```
┌─────────────────────────────────┐
│ JSON Import                     │
├─────────────────────────────────┤
│ [Upload File] or [Paste JSON]   │
│ ┌─────────────────────────────┐ │
│ │ JSON Input Area             │ │  
│ │                             │ │
│ └─────────────────────────────┘ │
│ [Validate & Preview] ✓          │
├─────────────────────────────────┤
│ Content Preview:                │
│ ✓ English (Twitter, Reddit)     │
│ ✓ Japanese (Twitter, Threads)   │
│ [Continue to Schedule] →        │
└─────────────────────────────────┘
```

**Tailwind CSS実装例**:
```typescript
// components/import/JSONImporter.tsx
'use client'

import { useAtom } from 'jotai'
import { useState } from 'react'
import { currentContentAtom, isImportingAtom, addToHistoryAtom } from '@/atoms/contentAtoms'

export default function JSONImporter() {
  const [currentContent, setCurrentContent] = useAtom(currentContentAtom)
  const [isImporting, setIsImporting] = useAtom(isImportingAtom)
  const [, addToHistory] = useAtom(addToHistoryAtom)
  const [jsonInput, setJsonInput] = useState('')
  const [validationErrors, setValidationErrors] = useState<string[]>([])

  const handleImport = async () => {
    setIsImporting(true)
    setValidationErrors([])
    
    try {
      const parsedContent = JSON.parse(jsonInput)
      
      // Validate quite-post format
      const errors = validateQuitePostFormat(parsedContent)
      if (errors.length > 0) {
        setValidationErrors(errors)
        return
      }
      
      const importedContent = {
        id: crypto.randomUUID(),
        user_id: '', // Will be set by server
        content: parsedContent,
        content_id: parsedContent.content_id,
        title: parsedContent.metadata?.title,
        tags: parsedContent.metadata?.tags || [],
        is_favorite: false,
        created_at: new Date().toISOString()
      }
      
      setCurrentContent(importedContent)
      addToHistory(importedContent)
    } catch (error) {
      setValidationErrors(['Invalid JSON format'])
    } finally {
      setIsImporting(false)
    }
  }

  const validateQuitePostFormat = (content: any): string[] => {
    const errors: string[] = []
    
    if (!content.version) errors.push('Missing version field')
    if (!content.content_id) errors.push('Missing content_id field')
    if (!content.metadata) errors.push('Missing metadata field')
    if (!content.languages) errors.push('Missing languages field')
    
    return errors
  }

  return (
    <div className="max-w-4xl mx-auto p-6">
      <div className="bg-white rounded-xl shadow-lg border border-gray-200 overflow-hidden">
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-600 to-blue-700 px-6 py-4">
          <h1 className="text-2xl font-bold text-white">JSON Content Importer</h1>
          <p className="text-blue-100 mt-1">Import quite-post format content</p>
        </div>
        
        {/* Form */}
        <div className="p-6 space-y-6">
          {/* JSON Input */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Paste JSON Content
            </label>
            <textarea
              value={jsonInput}
              onChange={(e) => setJsonInput(e.target.value)}
              placeholder={`{
  "version": "1.0",
  "content_id": "example-001",
  "metadata": {
    "title": "Example Post",
    "category": "tech",
    "tags": ["nextjs", "react"]
  },
  "languages": {
    "english": {
      "platforms": [...]
    }
  }
}`}
              rows={12}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors font-mono text-sm"
            />
          </div>

          {/* Validation Errors */}
          {validationErrors.length > 0 && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4">
              <h3 className="text-red-800 font-medium mb-2">Validation Errors:</h3>
              <ul className="text-red-700 text-sm space-y-1">
                {validationErrors.map((error, idx) => (
                  <li key={idx}>• {error}</li>
                ))}
              </ul>
            </div>
          )}

          {/* Import Button */}
          <button
            onClick={handleImport}
            disabled={!jsonInput.trim() || isImporting}
            className="w-full bg-gradient-to-r from-blue-600 to-blue-700 text-white font-bold py-4 px-6 rounded-lg hover:from-blue-700 hover:to-blue-800 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 flex items-center justify-center gap-2"
          >
            {isImporting ? (
              <>
                <div className="animate-spin rounded-full h-5 w-5 border-2 border-white border-t-transparent"></div>
                <span>Importing...</span>
              </>
            ) : (
              <>
                <span>📥</span>
                <span>Import Content</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Content Preview */}
      {currentContent && (
        <div className="mt-8 bg-white rounded-xl shadow-lg border border-gray-200 overflow-hidden">
          <div className="bg-gray-50 px-6 py-4 border-b border-gray-200">
            <h2 className="text-xl font-bold text-gray-800">Imported Content Preview</h2>
          </div>
          
          <div className="p-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Platform content previews would go here */}
              {/* Implementation details... */}
            </div>
            
            <div className="flex flex-col sm:flex-row gap-3 mt-6 pt-6 border-t border-gray-200">
              <button className="flex-1 bg-green-600 text-white font-medium py-3 px-4 rounded-lg hover:bg-green-700 transition-colors">
                📅 Schedule Post
              </button>
              <button className="flex-1 bg-purple-600 text-white font-medium py-3 px-4 rounded-lg hover:bg-purple-700 transition-colors">
                💾 Save to Favorites
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
```

#### `/schedule` - 投稿スケジューリング
```
┌─────────────────────────────────┐
│ Post Scheduler                  │
├─────────────────────────────────┤
│ 1. Select Content               │
│ [Imported Content List]         │
│ [Select] ✓                      │
├─────────────────────────────────┤
│ 2. Select Options               │
│ Language: [English ▼]           │
│ Platforms: ☑Twitter ☑Reddit    │
├─────────────────────────────────┤
│ 3. Choose Time                  │
│ 📅 Date: [YYYY-MM-DD]          │
│ ⏰ Time: [HH:MM]               │
│ [Schedule Post] 📅              │
└─────────────────────────────────┘
```

**カスタムUIコンポーネント例**:
```typescript
// components/ui/Button.tsx
import { forwardRef, ButtonHTMLAttributes } from 'react'
import { cn } from '@/lib/utils'

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'danger' | 'ghost'
  size?: 'sm' | 'md' | 'lg'
  loading?: boolean
}

const Button = forwardRef<HTMLButtonElement, ButtonProps>(({
  className,
  variant = 'primary',
  size = 'md',
  loading = false,
  disabled,
  children,
  ...props
}, ref) => {
  const baseStyles = "inline-flex items-center justify-center rounded-lg font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed"
  
  const variants = {
    primary: "bg-blue-600 text-white hover:bg-blue-700 focus:ring-blue-500",
    secondary: "bg-gray-100 text-gray-900 hover:bg-gray-200 focus:ring-gray-500",
    danger: "bg-red-600 text-white hover:bg-red-700 focus:ring-red-500",
    ghost: "bg-transparent text-gray-600 hover:bg-gray-100 focus:ring-gray-500"
  }
  
  const sizes = {
    sm: "px-3 py-1.5 text-sm",
    md: "px-4 py-2 text-sm",
    lg: "px-6 py-3 text-base"
  }

  return (
    <button
      ref={ref}
      className={cn(baseStyles, variants[variant], sizes[size], className)}
      disabled={disabled || loading}
      {...props}
    >
      {loading && (
        <div className="animate-spin rounded-full h-4 w-4 border-2 border-current border-t-transparent mr-2" />
      )}
      {children}
    </button>
  )
})

Button.displayName = 'Button'
export { Button }
```

```typescript
// components/ui/Card.tsx
import { forwardRef, HTMLAttributes } from 'react'
import { cn } from '@/lib/utils'

const Card = forwardRef<HTMLDivElement, HTMLAttributes<HTMLDivElement>>(({
  className,
  ...props
}, ref) => (
  <div
    ref={ref}
    className={cn("bg-white rounded-xl shadow-lg border border-gray-200", className)}
    {...props}
  />
))

const CardHeader = forwardRef<HTMLDivElement, HTMLAttributes<HTMLDivElement>>(({
  className,
  ...props
}, ref) => (
  <div
    ref={ref}
    className={cn("px-6 py-4 border-b border-gray-200", className)}
    {...props}
  />
))

const CardContent = forwardRef<HTMLDivElement, HTMLAttributes<HTMLDivElement>>(({
  className,
  ...props
}, ref) => (
  <div
    ref={ref}
    className={cn("p-6", className)}
    {...props}
  />
))

const CardTitle = forwardRef<HTMLHeadingElement, HTMLAttributes<HTMLHeadingElement>>(({
  className,
  ...props
}, ref) => (
  <h2
    ref={ref}
    className={cn("text-xl font-bold text-gray-800", className)}
    {...props}
  />
))

export { Card, CardHeader, CardContent, CardTitle }
```

```typescript
// components/ui/Input.tsx
import { forwardRef, InputHTMLAttributes } from 'react'
import { cn } from '@/lib/utils'

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  error?: string
}

const Input = forwardRef<HTMLInputElement, InputProps>(({
  className,
  error,
  ...props
}, ref) => (
  <div>
    <input
      ref={ref}
      className={cn(
        "w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors",
        error ? "border-red-500" : "border-gray-300",
        className
      )}
      {...props}
    />
    {error && (
      <p className="mt-1 text-sm text-red-600">{error}</p>
    )}
  </div>
))

Input.displayName = 'Input'
export { Input }
```

## 技術実装詳細

### フォルダ構成
```
src/
├── app/
│   ├── (auth)/
│   │   ├── login/
│   │   └── register/
│   ├── (dashboard)/
│   │   ├── create/
│   │   ├── schedule/
│   │   ├── history/
│   │   └── settings/
│   ├── api/
│   │   ├── generate/
│   │   ├── schedule/
│   │   └── notifications/
│   └── globals.css
├── components/
│   ├── ui/ (カスタムTailwind コンポーネント)
│   ├── content/
│   ├── schedule/
│   └── shared/
├── lib/
│   ├── supabase.ts
│   ├── gemini.ts
│   └── utils.ts
├── hooks/
├── atoms/ (Jotai atoms)
└── types/
```

### 状態管理（Jotai）
```typescript
// atoms/contentAtoms.ts
import { atom } from 'jotai'

export const currentContentAtom = atom<GeneratedContent | null>(null)
export const contentHistoryAtom = atom<GeneratedContent[]>([])
export const isGeneratingAtom = atom<boolean>(false)

// 派生atom
export const favoriteContentAtom = atom(
  (get) => get(contentHistoryAtom).filter(content => content.is_favorite)
)

// 書き込み専用atom
export const addToHistoryAtom = atom(
  null,
  (get, set, newContent: GeneratedContent) => {
    const currentHistory = get(contentHistoryAtom)
    set(contentHistoryAtom, [newContent, ...currentHistory])
  }
)
```

```typescript
// atoms/scheduleAtoms.ts
import { atom } from 'jotai'

export const schedulesAtom = atom<PostSchedule[]>([])
export const importedContentAtom = atom<ImportedContent | null>(null)
export const selectedLanguageAtom = atom<'english' | 'japanese'>('english')
export const selectedPlatformsAtom = atom<string[]>(['twitter'])

// 派生atom
export const upcomingSchedulesAtom = atom(
  (get) => get(schedulesAtom).filter(
    schedule => schedule.status === 'scheduled' && 
    new Date(schedule.scheduled_time) > new Date()
  )
)

// 書き込みatom
export const addScheduleAtom = atom(
  null,
  (get, set, newSchedule: PostSchedule) => {
    const currentSchedules = get(schedulesAtom)
    set(schedulesAtom, [...currentSchedules, newSchedule])
  }
)

export const updateScheduleStatusAtom = atom(
  null,
  (get, set, { id, status }: { id: string; status: string }) => {
    const currentSchedules = get(schedulesAtom)
    const updatedSchedules = currentSchedules.map(schedule =>
      schedule.id === id ? { ...schedule, status } : schedule
    )
    set(schedulesAtom, updatedSchedules)
  }
)
```

```typescript
// atoms/userAtoms.ts
import { atom } from 'jotai'

export const userAtom = atom<User | null>(null)
export const userSettingsAtom = atom<UserSettings>({
  language: 'en',
  timezone: 'UTC',
  theme: 'system',
  notifications: true
})

// localStorage 同期atom
export const userSettingsWithPersistenceAtom = atom(
  (get) => get(userSettingsAtom),
  (get, set, newSettings: UserSettings) => {
    set(userSettingsAtom, newSettings)
    localStorage.setItem('user_settings', JSON.stringify(newSettings))
  }
)
```

### API設計
```typescript
// API Routes
/api/import            POST  - JSONコンテンツインポート
/api/content/[id]      GET   - 特定コンテンツ取得
/api/content/history   GET   - コンテンツ履歴取得
/api/schedule          POST  - 投稿スケジュール作成
/api/schedule/[id]     PUT   - スケジュール更新
/api/copy/[id]         GET   - コピーページアクセス
/api/notifications     POST  - 通知設定
/api/export            POST  - JSONエクスポート
```

## 運用・監視

### パフォーマンス要件
- **初回ロード**: 3秒以内
- **AI生成**: 5秒以内
- **ページ遷移**: 1秒以内
- **API レスポンス**: 2秒以内

### 監視・分析
- **Vercel Analytics**: ページパフォーマンス
- **Supabase Analytics**: DB使用量・API呼び出し
- **Custom Metrics**: AI生成回数・成功率

### エラーハンドリング
```typescript
// app/error.tsx
export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen">
      <h2 className="text-2xl font-bold mb-4">Something went wrong!</h2>
      <button
        onClick={() => reset()}
        className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
      >
        Try again
      </button>
    </div>
  )
}
```

## デプロイ・CI/CD

### Vercel デプロイ設定
```json
// vercel.json
{
  "buildCommand": "npm run build",
  "framework": "nextjs",
  "env": {
    "NEXT_PUBLIC_SUPABASE_URL": "@supabase-url",
    "NEXT_PUBLIC_SUPABASE_ANON_KEY": "@supabase-anon-key",
    "SUPABASE_SERVICE_ROLE_KEY": "@supabase-service-key",
    "GEMINI_API_KEY": "@gemini-api-key",
    "GOOGLE_CALENDAR_API_KEY": "@google-calendar-key"
  }
}
```

### 環境設定
```bash
# .env.local
NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key
GEMINI_API_KEY=your_gemini_api_key
GOOGLE_CALENDAR_API_KEY=your_google_calendar_api_key
GOOGLE_CLIENT_ID=your_google_client_id
```

## セキュリティ（MVP版）

### セッションベースアクセス制御
- ローカルストレージベースのセッションID
- トークンベースコピーページアクセス
- API レート制限
- 30日間自動データ削除

### データ保護
```sql
-- セッションベースアクセス制御（MVP用）
CREATE POLICY "Session-based access for imported content" ON imported_content
  FOR ALL USING (true); -- MVP用簡易設定

CREATE POLICY "Token-based access for copy pages" ON scheduled_posts
  FOR ALL USING (true); -- MVP用簡易設定
```

## 開発スケジュール

### Phase 1: 基盤構築（2週間）
- Next.js プロジェクトセットアップ
- Supabase 設定・DB構築
- 認証システム実装
- 基本UI コンポーネント作成

### Phase 2: コンテンツ生成機能（2週間）
- AI API連携
- コンテンツ生成フォーム
- プレビュー・エクスポート機能
- 履歴管理

### Phase 3: スケジュール機能（2週間）
- JSON インポート
- スケジューリング UI
- Google Calendar 連携
- 通知システム

### Phase 4: 仕上げ・最適化（1週間）
- パフォーマンス最適化
- エラーハンドリング強化
- テスト・デバッグ
- デプロイ・公開

## 成功指標

### MVP成功基準
- **技術指標**:
  - 稼働率 99.5% 以上
  - AI生成成功率 95% 以上
  - ページロード時間 3秒以内
- **ユーザー指標**:
  - DAU 100人
  - コンテンツ生成回数 500回/日
  - 継続利用率 60%

このNext.js版では、bolt newで検証された機能をベースに、本格的なプロダクションレベルのアプリケーションを構築します。