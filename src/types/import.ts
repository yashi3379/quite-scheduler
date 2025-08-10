// JSONインポート関連の型定義
export interface ImportedJSON {
  version: string
  created_at: string
  content_id: string
  metadata: {
    title: string
    category: string
    tags: string[]
    priority: string
  }
  languages: {
    english?: {
      platforms: ImportedPlatformContent[]
    }
    japanese?: {
      platforms: ImportedPlatformContent[]
    }
  }
  export_settings?: {
    created_by: string
    compatible_apps: string[]
    expiry_date: string
  }
}

export interface ImportedPlatformContent {
  platform: string
  content: string
  metadata: {
    tokens: number
    cost: number
    model: string
    originalLength: number
    finalLength: number
  }
}

export interface ValidationError {
  field: string
  message: string
  severity: 'error' | 'warning'
}

export interface ImportResult {
  success: boolean
  data?: ImportedJSON
  errors: ValidationError[]
  warnings: ValidationError[]
}

export interface FormattedContent {
  content_id: string
  imported_content: ImportedJSON
  available_languages: string[]
  available_platforms: string[]
  metadata: ImportedJSON['metadata']
  created_at: string
}