# Quite Scheduler 実装チケット一覧

## 概要
Quite SchedulerのNext.js版実装のための11個のチケットです。PRD.mdの仕様とquite-post/jsonファイルの構造、quite-scheduler-boltのUIデザインを参考に作成されています。

**重要な変更点（MVP版）**:
- **認証システムを削除**: アノニマスユーザー対応でMVP開発を加速
- コンテンツ生成機能を削除し、インポート・スケジューリング中心のワークフローに変更
- next-intlによる国際化機能とwelcomeページを追加
- 専用コピーページ機能を追加
- AI最適時間提案はPhase 2に移行
- セッションベースのデータ管理でシンプル化

## チケット一覧

### 🔴 高優先度（必須機能）

#### [001: プロジェクト基盤構築](./001-project-foundation.md)
- **概要**: Next.js環境整備、TypeScriptセットアップ、基本フォルダ構成作成
- **見積もり**: 2-3時間
- **実装内容**: 依存関係追加、フォルダ構成、環境変数設定、基本ユーティリティ

#### [002: データベース設計・実装](./002-database-design.md)
- **概要**: Supabase設定、アノニマスユーザー対応テーブル作成、セッション管理
- **見積もり**: 3-4時間
- **実装内容**: session_dataテーブル、imported_contentテーブル、scheduled_postsテーブル、自動クリーンアップ

#### [003: Welcome・国際化機能実装](./003-welcome-internationalization.md)
- **概要**: next-intlによるIPアドレスベース言語自動設定とwelcomeページの実装
- **見積もり**: 5-6時間
- **実装内容**: 多言語対応、welcomeページ、言語切り替え、サンプルダウンロード

#### [006: JSONインポート・プレビュー機能実装](./006-json-import-preview.md)
- **概要**: quite-post JSONファイル解析、コンテンツプレビュー表示
- **見積もり**: 5-6時間
- **実装内容**: JSON検証、インポート機能、プレビュー、quite-post形式対応

#### [007: 投稿スケジューリング機能実装](./007-post-scheduling.md)
- **概要**: 基本スケジューリング、Google Calendar連携、タイムゾーン対応
- **見積もり**: 6-7時間
- **実装内容**: スケジューリングUI、Calendar API、データベース連携、アクセスURL生成

#### [008: 専用コピーページ実装](./008-copy-page.md)
- **概要**: URL経由でアクセス可能なコンテンツコピー専用ページの実装
- **見積もり**: 6-7時間
- **実装内容**: トークン認証、ワンクリックコピー、モバイル最適化、コピーステータス管理

### 🟡 中優先度（UX向上機能）

#### [004: 共通UIコンポーネント作成](./004-ui-components.md)
- **概要**: Button、Card、Input等の再利用可能コンポーネント（Tailwind CSS）
- **見積もり**: 3-4時間
- **実装内容**: 8種類のUIコンポーネント、アクセシビリティ対応、レスポンシブ

#### [005: 状態管理実装](./005-state-management.md)
- **概要**: Jotaiを使用したアトム定義、インポートコンテンツ・スケジュール・セッション状態管理
- **見積もり**: 4-5時間
- **実装内容**: インポートコンテンツ中心のアトム、セッション管理、派生アトム、永続化

#### [009: 通知システム実装](./009-notification-system.md)
- **概要**: Web Push API、投稿前通知（30分前・10分前・直前）
- **見積もり**: 5-6時間
- **実装内容**: Service Worker、Push通知、通知設定UI、マニフェスト

#### [010: 管理機能・最終調整](./010-management-features.md)
- **概要**: インポートコンテンツ履歴、設定画面、エラーハンドリング、パフォーマンス最適化
- **見積もり**: 6-8時間
- **実装内容**: 履歴管理、包括的設定、エラーバウンダリ、最適化、ダッシュボード

## 合計見積もり時間
**49-60時間** (約6-7営業日)


## 実装順序の推奨

### Phase 1: 基盤構築（1-2週間）
1. [001: プロジェクト基盤構築](./001-project-foundation.md)
2. [002: データベース設計・実装](./002-database-design.md)
3. [003: Welcome・国際化機能実装](./003-welcome-internationalization.md)
4. [004: 共通UIコンポーネント作成](./004-ui-components.md)

### Phase 2: コア機能（2-3週間）
5. [005: 状態管理実装](./005-state-management.md)
6. [006: JSONインポート・プレビュー機能実装](./006-json-import-preview.md)
7. [007: 投稿スケジューリング機能実装](./007-post-scheduling.md)
8. [008: 専用コピーページ実装](./008-copy-page.md)

### Phase 3: 完成（1-2週間）
9. [009: 通知システム実装](./009-notification-system.md)
10. [010: 管理機能・最終調整](./010-management-features.md)

### Phase 4: 将来拡張（MVP後）
- **認証システム導入**: Supabase Auth、OAuth連携
- **AI最適時間提案**: Gemini API連携

## 技術スタック確認

### フロントエンド
- ✅ Next.js 15 (App Router)
- ✅ TypeScript
- ✅ Tailwind CSS
- ✅ Jotai (状態管理)
- ✅ next-intl (国際化)

### バックエンド・インフラ
- ✅ Supabase (データベース・認証)
- ✅ Google Calendar API
- ✅ Web Push API
- ✅ Vercel (デプロイ)

### Phase 4（将来）
- 🔄 Supabase Auth (認証システム)
- 🔄 Google Gemini 2.0 Flash Lite (AI最適時間提案)

### 参考資料
- ✅ PRD.md - 詳細仕様
- ✅ quite-post/json/*.json - JSONデータ構造
- ✅ quite-scheduler-bolt/src - UIデザイン参考

## 品質保証

各チケットには以下が含まれています：
- 📋 **完了条件**: 具体的な検証項目
- 📁 **関連ファイル**: 作成・修正するファイル一覧
- ⏰ **見積もり時間**: 実装にかかる時間
- ⚠️ **注意事項**: セキュリティ・パフォーマンス・UX考慮点

## 開始前の準備

1. **環境変数の用意**:
   - Supabase URL・キー  
   - Google Calendar API キー
   - VAPID キー（通知用）
   - NEXT_PUBLIC_BASE_URL（コピーページ用）

2. **外部サービス設定**:
   - Supabaseプロジェクト作成
   - Google Cloud Console設定（Calendar API有効化）
   - Vercelアカウント準備

3. **開発環境**:
   - Node.js 18+
   - エディタ（VS Code推奨）
   - Git

## ワークフロー概要

新しいアプリケーションの流れ:
1. **Welcome Page**: IPアドレスベース言語検出、使い方説明
2. **JSON Import**: quite-post形式コンテンツのインポート
3. **Scheduling**: 日時選択とGoogle Calendar連携
4. **Copy Page**: URL経由でのワンクリックコンテンツコピー
5. **Notifications**: Web Push通知システム

## 進捗管理

各チケットの完了条件をチェックしながら進行してください。
問題が発生した場合は、関連チケットの「注意事項」セクションを参照してください。