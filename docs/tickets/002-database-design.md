# チケット #002: データベース設計・実装

## 概要
Supabase設定、テーブル作成、RLS（Row Level Security）設定

## 優先度
🔴 高優先度

## 詳細説明
**MVP版**: 認証なしのアノニマスユーザー対応でSupabaseデータベース設計を実装する。シンプルな構成でコア機能に集中。

## 実装内容

### 1. Supabaseプロジェクト設定
- 新しいSupabaseプロジェクトの作成
- 環境変数の設定
- `lib/supabase.ts`クライアント作成

### 2. データベーステーブル作成

#### session_dataテーブル（MVP用）
```sql
-- アノニマスユーザーのセッションデータ管理
CREATE TABLE session_data (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id TEXT UNIQUE NOT NULL,
  timezone TEXT DEFAULT 'UTC',
  language TEXT DEFAULT 'en',
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  expires_at TIMESTAMP DEFAULT (NOW() + INTERVAL '30 days')
);
```

#### imported_contentテーブル
```sql
CREATE TABLE imported_content (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id TEXT NOT NULL, -- セッションID参照
  original_filename TEXT,
  content JSONB NOT NULL,
  content_id TEXT NOT NULL,
  title TEXT,
  tags TEXT[],
  is_favorite BOOLEAN DEFAULT false,
  created_at TIMESTAMP DEFAULT NOW()
);
```

#### scheduled_postsテーブル
```sql
CREATE TABLE scheduled_posts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id TEXT NOT NULL, -- セッションID参照
  content_id UUID REFERENCES imported_content(id),
  imported_content JSONB NOT NULL,
  selected_language TEXT NOT NULL,
  selected_platforms TEXT[] NOT NULL,
  scheduled_time TIMESTAMP NOT NULL,
  status TEXT DEFAULT 'scheduled',
  calendar_event_id TEXT,
  access_token TEXT NOT NULL DEFAULT gen_random_uuid(),
  copy_status JSONB DEFAULT '{}',
  notifications_sent TEXT[] DEFAULT ARRAY[]::TEXT[],
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);
```

#### app_settingsテーブル（MVP用）
```sql
-- アプリ全体設定（MVP用）
CREATE TABLE app_settings (
  session_id TEXT PRIMARY KEY,
  notification_settings JSONB DEFAULT '{}',
  calendar_integration BOOLEAN DEFAULT false,
  language_preference TEXT DEFAULT 'auto',
  timezone TEXT DEFAULT 'UTC',
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);
```

### 3. セッション管理（MVP用）

#### セッションデータの自動削除
```sql
-- 期限切れセッションデータの自動削除関数
CREATE OR REPLACE FUNCTION cleanup_expired_sessions()
RETURNS void AS $$
BEGIN
  -- 期限切れセッションとその関連データを削除
  DELETE FROM scheduled_posts 
  WHERE session_id IN (
    SELECT session_id FROM session_data 
    WHERE expires_at < NOW()
  );
  
  DELETE FROM imported_content 
  WHERE session_id IN (
    SELECT session_id FROM session_data 
    WHERE expires_at < NOW()
  );
  
  DELETE FROM app_settings 
  WHERE session_id IN (
    SELECT session_id FROM session_data 
    WHERE expires_at < NOW()
  );
  
  DELETE FROM session_data WHERE expires_at < NOW();
END;
$$ LANGUAGE plpgsql;

-- 定期実行設定（1日1回）
SELECT cron.schedule('cleanup-sessions', '0 2 * * *', 'SELECT cleanup_expired_sessions();');
```

#### セッション管理のRLS（緩い設定）
```sql
-- MVP用：簡易なアクセス制御
ALTER TABLE imported_content ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Session-based access for imported content" 
ON imported_content FOR ALL 
USING (true); -- MVP用：一時的に全アクセス許可

ALTER TABLE scheduled_posts ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Session-based access for scheduled posts" 
ON scheduled_posts FOR ALL 
USING (true); -- MVP用：一時的に全アクセス許可

-- 本格運用時はsession_idベースに変更予定
```

### 4. インデックス作成
パフォーマンス最適化のためのインデックス:
```sql
-- セッションベースのインデックス
CREATE INDEX idx_session_data_session_id 
ON session_data(session_id);

CREATE INDEX idx_session_data_expires 
ON session_data(expires_at);

CREATE INDEX idx_imported_content_session_created 
ON imported_content(session_id, created_at DESC);

CREATE INDEX idx_scheduled_posts_session_time 
ON scheduled_posts(session_id, scheduled_time);

CREATE INDEX idx_scheduled_posts_status 
ON scheduled_posts(status, scheduled_time);

CREATE INDEX idx_scheduled_posts_access_token 
ON scheduled_posts(access_token);
```

### 5. Supabaseクライアント設定
```typescript
// lib/supabase.ts
import { createClient } from '@supabase/supabase-js'
import { Database } from '@/types/database'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

export const supabase = createClient<Database>(supabaseUrl, supabaseAnonKey)

// セッションID管理
export const getOrCreateSessionId = (): string => {
  if (typeof window === 'undefined') return ''
  
  let sessionId = localStorage.getItem('quite_scheduler_session')
  if (!sessionId) {
    sessionId = crypto.randomUUID()
    localStorage.setItem('quite_scheduler_session', sessionId)
  }
  return sessionId
}

// セッションデータ初期化
export const initializeSession = async () => {
  const sessionId = getOrCreateSessionId()
  
  const { data: existingSession } = await supabase
    .from('session_data')
    .select('id')
    .eq('session_id', sessionId)
    .single()
  
  if (!existingSession) {
    await supabase
      .from('session_data')
      .insert({
        session_id: sessionId,
        timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
        language: navigator.language.startsWith('ja') ? 'ja' : 'en'
      })
  }
  
  return sessionId
}
```

## 完了条件
- [x] Supabaseプロジェクトが作成済み
- [x] MVP用テーブル（session_data, imported_content, scheduled_posts, app_settings）が作成済み
- [x] セッション管理機能が実装済み
- [x] インデックスが作成済み
- [x] Supabaseクライアントが実装済み
- [x] セッション初期化機能が実装済み
- [x] 自動セッションクリーンアップが設定済み
- [x] データベース接続テストが成功
- [x] 型定義ファイルが生成済み

## 関連ファイル
- `lib/supabase.ts`
- `types/database.ts`
- `.env.local`

## 見積もり時間
3-4時間

## 注意事項
- **MVP仕様**: 認証なしでセッションIDベースの管理
- セッションデータは30日で自動削除
- 本格運用時は認証システムに移行予定
- JSONBフィールドは適切にインデックス化
- セッション期限切れ時の適切なエラーハンドリング必要