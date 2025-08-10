-- Quite Scheduler MVP Database Schema
-- セッションベースの匿名ユーザー対応

-- 1. セッションデータテーブル（MVP用）
CREATE TABLE IF NOT EXISTS session_data (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id TEXT UNIQUE NOT NULL,
  timezone TEXT DEFAULT 'UTC',
  language TEXT DEFAULT 'en',
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  expires_at TIMESTAMP DEFAULT (NOW() + INTERVAL '30 days')
);

-- 2. インポートされたコンテンツテーブル
CREATE TABLE IF NOT EXISTS imported_content (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id TEXT NOT NULL,
  original_filename TEXT,
  content JSONB NOT NULL,
  content_id TEXT NOT NULL,
  title TEXT,
  tags TEXT[],
  is_favorite BOOLEAN DEFAULT false,
  created_at TIMESTAMP DEFAULT NOW()
);

-- 3. スケジュールされた投稿テーブル
CREATE TABLE IF NOT EXISTS scheduled_posts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id TEXT NOT NULL,
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

-- 4. アプリ設定テーブル（MVP用）
CREATE TABLE IF NOT EXISTS app_settings (
  session_id TEXT PRIMARY KEY,
  notification_settings JSONB DEFAULT '{}',
  calendar_integration BOOLEAN DEFAULT false,
  language_preference TEXT DEFAULT 'auto',
  timezone TEXT DEFAULT 'UTC',
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- 5. セッション管理関数
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

-- 6. RLS（Row Level Security）設定
ALTER TABLE imported_content ENABLE ROW LEVEL SECURITY;
CREATE POLICY IF NOT EXISTS "Session-based access for imported content" 
ON imported_content FOR ALL 
USING (true); -- MVP用：一時的に全アクセス許可

ALTER TABLE scheduled_posts ENABLE ROW LEVEL SECURITY;
CREATE POLICY IF NOT EXISTS "Session-based access for scheduled posts" 
ON scheduled_posts FOR ALL 
USING (true); -- MVP用：一時的に全アクセス許可

-- 7. パフォーマンス最適化インデックス
CREATE INDEX IF NOT EXISTS idx_session_data_session_id 
ON session_data(session_id);

CREATE INDEX IF NOT EXISTS idx_session_data_expires 
ON session_data(expires_at);

CREATE INDEX IF NOT EXISTS idx_imported_content_session_created 
ON imported_content(session_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_scheduled_posts_session_time 
ON scheduled_posts(session_id, scheduled_time);

CREATE INDEX IF NOT EXISTS idx_scheduled_posts_status 
ON scheduled_posts(status, scheduled_time);

CREATE INDEX IF NOT EXISTS idx_scheduled_posts_access_token 
ON scheduled_posts(access_token);

-- 8. 期限切れセッション定期削除（pg_cronが利用可能な場合）
-- SELECT cron.schedule('cleanup-sessions', '0 2 * * *', 'SELECT cleanup_expired_sessions();');