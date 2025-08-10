# チケット #003: Welcome・国際化機能実装

## 概要
next-intlによるIPアドレスベース言語自動設定とwelcomeページの実装

## 優先度
🔴 高優先度

## 詳細説明
アプリケーションのエントリーポイントとしてwelcomeページを実装し、IPアドレスに基づく自動言語検出機能とマニュアル言語切り替え、アプリケーションの使い方説明を提供する。

## 実装内容

### 1. next-intl設定

#### next.config.js設定
```javascript
// next.config.js
const withNextIntl = require('next-intl/plugin')(
  './src/i18n.ts'
);

module.exports = withNextIntl({
  // その他のNext.js設定
  experimental: {
    appDir: true,
  },
});
```

#### 国際化設定ファイル
```typescript
// src/i18n.ts
import {notFound} from 'next/navigation';
import {getRequestConfig} from 'next-intl/server';
 
const locales = ['en', 'ja'];
 
export default getRequestConfig(async ({locale}) => {
  if (!locales.includes(locale as any)) notFound();
 
  return {
    messages: (await import(`../messages/${locale}.json`)).default
  };
});
```

#### ミドルウェア設定
```typescript
// src/middleware.ts
import createMiddleware from 'next-intl/middleware';
 
export default createMiddleware({
  locales: ['en', 'ja'],
  defaultLocale: 'en',
  localeDetection: true, // IPアドレスベース自動検出有効化
});
 
export const config = {
  matcher: ['/((?!api|_next|_vercel|.*\\..*).*)']
};
```

### 2. 多言語メッセージファイル

#### 英語メッセージ
```json
// messages/en.json
{
  "welcome": {
    "title": "Welcome to SocialCraft",
    "subtitle": "SNS Content Scheduling Platform",
    "description": "Efficiently schedule and manage your social media content with our streamlined workflow.",
    "workflow": {
      "title": "How it works",
      "step1": {
        "title": "Import JSON Content",
        "description": "Import content created externally in quite-post format"
      },
      "step2": {
        "title": "Select Schedule",
        "description": "Choose posting date and time from calendar"
      },
      "step3": {
        "title": "Google Calendar Integration",
        "description": "Get reminders with dedicated URL in your calendar"
      },
      "step4": {
        "title": "Web Push Notifications",
        "description": "Receive notifications 30min, 10min, and right before posting"
      },
      "step5": {
        "title": "One-Click Copy",
        "description": "Access content URL and copy with single click"
      }
    },
    "features": {
      "title": "Key Features",
      "multiLanguage": "Multi-language support (English/Japanese)",
      "platforms": "Multiple platforms (Twitter, Reddit, Threads)",
      "scheduling": "Flexible scheduling with timezone support",
      "notifications": "Smart notification system",
      "integration": "Google Calendar integration"
    },
    "buttons": {
      "getStarted": "Get Started",
      "downloadSample": "Download Sample JSON",
      "learnMore": "Learn More"
    }
  },
  "common": {
    "language": "Language",
    "english": "English",
    "japanese": "Japanese",
    "loading": "Loading...",
    "error": "An error occurred",
    "success": "Success!"
  }
}
```

#### 日本語メッセージ
```json
// messages/ja.json
{
  "welcome": {
    "title": "SocialCraft へようこそ",
    "subtitle": "SNSコンテンツ スケジューリング プラットフォーム",
    "description": "効率的なワークフローで、ソーシャルメディアコンテンツのスケジューリングと管理を簡単に。",
    "workflow": {
      "title": "使い方",
      "step1": {
        "title": "JSONコンテンツをインポート",
        "description": "外部で作成されたquite-post形式のコンテンツをインポート"
      },
      "step2": {
        "title": "投稿日時を選択",
        "description": "カレンダーから投稿日時を選択"
      },
      "step3": {
        "title": "Google Calendar連携",
        "description": "専用URLを含むリマインダーをカレンダーに登録"
      },
      "step4": {
        "title": "Web Push通知",
        "description": "30分前・10分前・直前に通知を受信"
      },
      "step5": {
        "title": "ワンクリックコピー",
        "description": "コンテンツURLにアクセスしてワンクリックでコピー"
      }
    },
    "features": {
      "title": "主な機能",
      "multiLanguage": "多言語対応（英語・日本語）",
      "platforms": "複数プラットフォーム対応（Twitter、Reddit、Threads）",
      "scheduling": "タイムゾーン対応の柔軟なスケジューリング",
      "notifications": "スマート通知システム",
      "integration": "Google Calendar連携"
    },
    "buttons": {
      "getStarted": "はじめる",
      "downloadSample": "サンプルJSONをダウンロード",
      "learnMore": "詳しく見る"
    }
  },
  "common": {
    "language": "言語",
    "english": "English",
    "japanese": "日本語",
    "loading": "読み込み中...",
    "error": "エラーが発生しました",
    "success": "成功！"
  }
}
```

### 3. Welcomeページコンポーネント

```typescript
// app/[locale]/page.tsx
import { useTranslations } from 'next-intl';
import { getTranslations } from 'next-intl/server';
import Link from 'next/link';
import LanguageSwitcher from '@/components/shared/LanguageSwitcher';
import WorkflowSteps from '@/components/welcome/WorkflowSteps';
import FeaturesList from '@/components/welcome/FeaturesList';
import SampleDownload from '@/components/welcome/SampleDownload';

export async function generateMetadata({params: {locale}}) {
  const t = await getTranslations({locale, namespace: 'welcome'});
 
  return {
    title: t('title'),
    description: t('description')
  };
}

export default function WelcomePage() {
  const t = useTranslations('welcome');

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      {/* Header */}
      <header className="container mx-auto px-4 py-6">
        <div className="flex justify-between items-center">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-blue-600 rounded-lg flex items-center justify-center">
              <span className="text-white font-bold text-xl">S</span>
            </div>
            <span className="text-xl font-bold text-gray-800">SocialCraft</span>
          </div>
          <LanguageSwitcher />
        </div>
      </header>

      {/* Hero Section */}
      <main className="container mx-auto px-4 py-12">
        <div className="text-center mb-16">
          <h1 className="text-5xl font-bold text-gray-900 mb-4">
            {t('title')}
          </h1>
          <p className="text-xl text-blue-600 font-medium mb-6">
            {t('subtitle')}
          </p>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto mb-8">
            {t('description')}
          </p>
          
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link 
              href="/import" 
              className="bg-blue-600 text-white px-8 py-4 rounded-lg font-semibold hover:bg-blue-700 transition-colors inline-flex items-center justify-center gap-2"
            >
              <span>🚀</span>
              {t('buttons.getStarted')}
            </Link>
            <SampleDownload />
          </div>
        </div>

        {/* Workflow Steps */}
        <WorkflowSteps />

        {/* Features */}
        <FeaturesList />

        {/* CTA Section */}
        <div className="text-center mt-16 bg-white rounded-2xl shadow-lg p-12">
          <h2 className="text-3xl font-bold text-gray-900 mb-4">
            {t('buttons.learnMore')}
          </h2>
          <p className="text-gray-600 mb-8 max-w-2xl mx-auto">
            {t('description')}
          </p>
          <Link 
            href="/import" 
            className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white px-8 py-4 rounded-lg font-semibold hover:from-blue-700 hover:to-indigo-700 transition-all inline-flex items-center justify-center gap-2"
          >
            <span>📥</span>
            {t('buttons.getStarted')}
          </Link>
        </div>
      </main>

      {/* Footer */}
      <footer className="container mx-auto px-4 py-8 mt-16 border-t border-gray-200">
        <div className="text-center text-gray-500">
          <p>&copy; 2024 SocialCraft. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
}
```

### 4. 言語切り替えコンポーネント

```typescript
// components/shared/LanguageSwitcher.tsx
'use client';

import { useLocale } from 'next-intl';
import { useRouter, usePathname } from 'next/navigation';
import { useTranslations } from 'next-intl';

export default function LanguageSwitcher() {
  const t = useTranslations('common');
  const locale = useLocale();
  const router = useRouter();
  const pathname = usePathname();

  const switchLocale = (newLocale: string) => {
    const newPath = pathname.replace(`/${locale}`, `/${newLocale}`);
    router.replace(newPath);
  };

  return (
    <div className="relative">
      <div className="flex bg-white rounded-lg border border-gray-200 p-1">
        <button
          onClick={() => switchLocale('en')}
          className={`px-3 py-2 rounded-md text-sm font-medium transition-all ${
            locale === 'en'
              ? 'bg-blue-600 text-white shadow-sm'
              : 'text-gray-600 hover:text-gray-900'
          }`}
        >
          🇺🇸 EN
        </button>
        <button
          onClick={() => switchLocale('ja')}
          className={`px-3 py-2 rounded-md text-sm font-medium transition-all ${
            locale === 'ja'
              ? 'bg-blue-600 text-white shadow-sm'
              : 'text-gray-600 hover:text-gray-900'
          }`}
        >
          🇯🇵 JP
        </button>
      </div>
    </div>
  );
}
```

### 5. ワークフローステップコンポーネント

```typescript
// components/welcome/WorkflowSteps.tsx
import { useTranslations } from 'next-intl';

export default function WorkflowSteps() {
  const t = useTranslations('welcome.workflow');

  const steps = [
    {
      number: 1,
      icon: '📥',
      title: t('step1.title'),
      description: t('step1.description'),
    },
    {
      number: 2,
      icon: '📅',
      title: t('step2.title'),
      description: t('step2.description'),
    },
    {
      number: 3,
      icon: '🔗',
      title: t('step3.title'),
      description: t('step3.description'),
    },
    {
      number: 4,
      icon: '🔔',
      title: t('step4.title'),
      description: t('step4.description'),
    },
    {
      number: 5,
      icon: '📋',
      title: t('step5.title'),
      description: t('step5.description'),
    },
  ];

  return (
    <div className="mb-16">
      <h2 className="text-3xl font-bold text-center text-gray-900 mb-12">
        {t('title')}
      </h2>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-8">
        {steps.map((step, index) => (
          <div key={step.number} className="text-center relative">
            {/* Connection Line */}
            {index < steps.length - 1 && (
              <div className="hidden lg:block absolute top-12 left-1/2 w-full h-0.5 bg-gray-300 z-0" 
                   style={{transform: 'translateX(50%)'}} />
            )}
            
            {/* Step Card */}
            <div className="bg-white rounded-xl shadow-lg p-6 relative z-10">
              <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-2xl">{step.icon}</span>
              </div>
              <div className="w-8 h-8 bg-blue-600 text-white rounded-full flex items-center justify-center mx-auto mb-4 -mt-2">
                <span className="text-sm font-bold">{step.number}</span>
              </div>
              <h3 className="font-semibold text-gray-900 mb-2">
                {step.title}
              </h3>
              <p className="text-sm text-gray-600">
                {step.description}
              </p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
```

### 6. サンプルダウンロードコンポーネント

```typescript
// components/welcome/SampleDownload.tsx
'use client';

import { useTranslations } from 'next-intl';

export default function SampleDownload() {
  const t = useTranslations('welcome');

  const downloadSample = () => {
    const sampleData = {
      version: "1.0",
      created_at: new Date().toISOString(),
      content_id: "sample-001",
      metadata: {
        title: "Sample Social Media Post",
        category: "tech",
        tags: ["nextjs", "react", "javascript"],
        priority: "medium"
      },
      languages: {
        english: {
          platforms: [
            {
              platform: "twitter",
              content: "🚀 Excited to share our latest Next.js project! Built with modern React patterns and optimized for performance. Check it out! #NextJS #React #WebDev",
              metadata: {
                tokens: 1250,
                cost: 0.0025,
                model: "gpt-4o-mini",
                originalLength: 145,
                finalLength: 140
              }
            },
            {
              platform: "reddit",
              content: "Hey r/nextjs! Just finished building a social media scheduling app with Next.js 15 and the new App Router. The performance improvements are incredible!\n\nKey features:\n- Server-side rendering with streaming\n- Optimized bundle splitting\n- Edge runtime support\n\nHappy to answer any questions about the implementation!",
              metadata: {
                tokens: 2100,
                cost: 0.0042,
                model: "gpt-4o-mini",
                originalLength: 285,
                finalLength: 280
              }
            }
          ]
        },
        japanese: {
          platforms: [
            {
              platform: "twitter",
              content: "🚀 最新のNext.jsプロジェクトをシェアします！モダンなReactパターンで構築し、パフォーマンスを最適化しました。ぜひチェックしてください！#NextJS #React #WebDev",
              metadata: {
                tokens: 1180,
                cost: 0.0024,
                model: "gpt-4o-mini", 
                originalLength: 98,
                finalLength: 95
              }
            }
          ]
        }
      }
    };

    const dataStr = JSON.stringify(sampleData, null, 2);
    const dataUri = 'data:application/json;charset=utf-8,'+ encodeURIComponent(dataStr);
    
    const exportFileDefaultName = 'quite-post-sample.json';
    
    const linkElement = document.createElement('a');
    linkElement.setAttribute('href', dataUri);
    linkElement.setAttribute('download', exportFileDefaultName);
    linkElement.click();
  };

  return (
    <button
      onClick={downloadSample}
      className="bg-white text-blue-600 border-2 border-blue-600 px-8 py-4 rounded-lg font-semibold hover:bg-blue-50 transition-colors inline-flex items-center justify-center gap-2"
    >
      <span>📥</span>
      {t('buttons.downloadSample')}
    </button>
  );
}
```

## 完了条件
- [x] next-intl設定が完了済み
- [x] 多言語メッセージファイルが作成済み
- [x] ミドルウェアでIPベース言語検出が実装済み
- [x] Welcomeページが実装済み
- [x] 言語切り替えコンポーネントが実装済み
- [x] ワークフローステップ表示が実装済み
- [x] サンプルJSONダウンロード機能が実装済み
- [x] レスポンシブデザインが実装済み

## 関連ファイル
- `next.config.js`
- `src/i18n.ts`
- `src/middleware.ts`
- `messages/en.json`
- `messages/ja.json`
- `app/[locale]/page.tsx`
- `components/shared/LanguageSwitcher.tsx`
- `components/welcome/WorkflowSteps.tsx`
- `components/welcome/FeaturesList.tsx`
- `components/welcome/SampleDownload.tsx`

## 見積もり時間
5-6時間

## 注意事項
- IPアドレスベース言語検出はサーバーサイドで実行
- 言語切り替え時のルーティングを適切に処理
- サンプルJSONは実際のquite-post形式に準拠
- アクセシビリティを考慮したUI設計
- SEO最適化（meta tags、structured data）