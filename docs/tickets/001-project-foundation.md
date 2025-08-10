# チケット #001: プロジェクト基盤構築

## 概要
Next.js環境整備、TypeScriptセットアップ、基本フォルダ構成作成

## 優先度
🔴 高優先度

## 詳細説明
プロジェクトの基盤となるNext.js環境を整備し、PRDに基づいた開発環境を完全にセットアップする。

## 実装内容

### 1. 依存関係の追加
```bash
npm install jotai @google/generative-ai @supabase/supabase-js
npm install -D @types/node
```

### 2. フォルダ構成作成
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
│   ├── ui/
│   ├── content/
│   ├── schedule/
│   └── shared/
├── lib/
│   ├── supabase.ts
│   ├── gemini.ts
│   └── utils.ts
├── hooks/
├── atoms/
└── types/
```

### 3. 環境変数設定
```.env.local```ファイルの作成:
```bash
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=
GEMINI_API_KEY=
GOOGLE_CALENDAR_API_KEY=
GOOGLE_CLIENT_ID=
```

### 4. TypeScript設定
```tsconfig.json```の最適化とパス設定

### 5. ユーティリティ関数
- `lib/utils.ts` - cn関数（Tailwind CSS クラス結合）
- 基本型定義の作成

## 完了条件
- [x] 必要な依存関係がすべてインストール済み
- [x] フォルダ構成が完全に作成済み
- [x] 環境変数テンプレートが作成済み
- [x] TypeScript設定が完了
- [x] ユーティリティ関数が実装済み
- [x] 開発サーバーが正常に起動する

## 関連ファイル
- `package.json`
- `tsconfig.json`
- `.env.local`
- `src/lib/utils.ts`
- `src/types/index.ts`

## 見積もり時間
2-3時間

## 注意事項
- PRDに記載された技術スタックに厳密に従う
- quite-scheduler-boltのUIパターンを参考にする
- セキュリティを考慮した環境変数管理