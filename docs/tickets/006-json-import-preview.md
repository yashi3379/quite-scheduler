# チケット #006: JSONインポート・プレビュー機能実装

## 概要
quite-post JSONファイル解析、コンテンツプレビュー表示

## 優先度
🔴 高優先度

## 詳細説明
quite-post/jsonフォルダのJSONファイル形式を解析し、インポート・検証・プレビュー機能を実装する。

## 実装内容

### 1. JSON型定義
```typescript
// types/import.ts
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
  export_settings: {
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
```

### 2. JSON検証ユーティリティ
```typescript
// lib/jsonValidator.ts
import { ImportedJSON, ValidationError, ImportResult } from '@/types/import'

export function validateImportedJSON(jsonString: string): ImportResult {
  const errors: ValidationError[] = []
  const warnings: ValidationError[] = []
  
  try {
    const data = JSON.parse(jsonString) as ImportedJSON
    
    // 必須フィールドの検証
    if (!data.version) {
      errors.push({
        field: 'version',
        message: 'Version field is required',
        severity: 'error'
      })
    }
    
    if (!data.content_id) {
      errors.push({
        field: 'content_id',
        message: 'Content ID is required',
        severity: 'error'
      })
    }
    
    if (!data.languages || Object.keys(data.languages).length === 0) {
      errors.push({
        field: 'languages',
        message: 'At least one language is required',
        severity: 'error'
      })
    }
    
    // 言語ごとの検証
    if (data.languages) {
      Object.entries(data.languages).forEach(([lang, langData]) => {
        if (!langData.platforms || langData.platforms.length === 0) {
          warnings.push({
            field: `languages.${lang}.platforms`,
            message: `No platforms found for ${lang}`,
            severity: 'warning'
          })
        }
        
        langData.platforms?.forEach((platform, index) => {
          if (!platform.platform) {
            errors.push({
              field: `languages.${lang}.platforms[${index}].platform`,
              message: 'Platform name is required',
              severity: 'error'
            })
          }
          
          if (!platform.content) {
            errors.push({
              field: `languages.${lang}.platforms[${index}].content`,
              message: 'Platform content is required',
              severity: 'error'
            })
          }
          
          // プラットフォーム別の検証
          if (platform.platform === 'twitter' && platform.content.length > 280) {
            warnings.push({
              field: `languages.${lang}.platforms[${index}].content`,
              message: 'Twitter content exceeds 280 characters',
              severity: 'warning'
            })
          }
          
          if (platform.platform === 'threads' && platform.content.length > 500) {
            warnings.push({
              field: `languages.${lang}.platforms[${index}].content`,
              message: 'Threads content exceeds 500 characters',
              severity: 'warning'
            })
          }
        })
      })
    }
    
    // 有効期限の検証
    if (data.export_settings?.expiry_date) {
      const expiryDate = new Date(data.export_settings.expiry_date)
      if (expiryDate < new Date()) {
        warnings.push({
          field: 'export_settings.expiry_date',
          message: 'Content has expired',
          severity: 'warning'
        })
      }
    }
    
    // 互換性の検証
    if (data.export_settings?.compatible_apps && 
        !data.export_settings.compatible_apps.includes('quite-scheduler')) {
      warnings.push({
        field: 'export_settings.compatible_apps',
        message: 'Content may not be fully compatible with quite-scheduler',
        severity: 'warning'
      })
    }
    
    return {
      success: errors.length === 0,
      data: errors.length === 0 ? data : undefined,
      errors,
      warnings
    }
    
  } catch (parseError) {
    return {
      success: false,
      errors: [{
        field: 'json',
        message: 'Invalid JSON format',
        severity: 'error'
      }],
      warnings: []
    }
  }
}

export function formatContentForScheduling(importedData: ImportedJSON) {
  return {
    content_id: importedData.content_id,
    imported_content: importedData,
    available_languages: Object.keys(importedData.languages),
    available_platforms: Object.values(importedData.languages)
      .flatMap(lang => lang.platforms.map(p => p.platform))
      .filter((platform, index, arr) => arr.indexOf(platform) === index),
    metadata: importedData.metadata,
    created_at: importedData.created_at
  }
}
```

### 3. JSONインポートコンポーネント
```typescript
// components/schedule/JSONImporter.tsx
'use client'
import { useState } from 'react'
import { useAtom } from 'jotai'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Textarea } from '@/components/ui/Textarea'
import { Badge } from '@/components/ui/Badge'
import { validateImportedJSON, formatContentForScheduling } from '@/lib/jsonValidator'
import { importedContentAtom } from '@/atoms/scheduleAtoms'
import { ImportResult, ValidationError } from '@/types/import'

export default function JSONImporter() {
  const [, setImportedContent] = useAtom(importedContentAtom)
  const [jsonInput, setJsonInput] = useState('')
  const [validationResult, setValidationResult] = useState<ImportResult | null>(null)
  const [isImporting, setIsImporting] = useState(false)

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    if (file.type !== 'application/json') {
      setValidationResult({
        success: false,
        errors: [{
          field: 'file',
          message: 'Please select a JSON file',
          severity: 'error'
        }],
        warnings: []
      })
      return
    }

    const reader = new FileReader()
    reader.onload = (e) => {
      const content = e.target?.result as string
      setJsonInput(content)
      handleValidation(content)
    }
    reader.readAsText(file)
  }

  const handleValidation = (jsonString: string) => {
    if (!jsonString.trim()) {
      setValidationResult(null)
      return
    }

    const result = validateImportedJSON(jsonString)
    setValidationResult(result)
  }

  const handleImport = () => {
    if (!validationResult?.success || !validationResult.data) return

    setIsImporting(true)
    
    try {
      const formattedContent = formatContentForScheduling(validationResult.data)
      setImportedContent(formattedContent)
      
      // 成功通知
      setTimeout(() => {
        setIsImporting(false)
      }, 1000)
      
    } catch (error) {
      console.error('Import failed:', error)
      setIsImporting(false)
    }
  }

  const renderValidationMessages = (messages: ValidationError[], type: 'error' | 'warning') => {
    const filteredMessages = messages.filter(msg => msg.severity === type)
    if (filteredMessages.length === 0) return null

    return (
      <div className={`p-4 rounded-lg ${
        type === 'error' ? 'bg-red-50 border border-red-200' : 'bg-yellow-50 border border-yellow-200'
      }`}>
        <h4 className={`font-medium mb-2 ${
          type === 'error' ? 'text-red-800' : 'text-yellow-800'
        }`}>
          {type === 'error' ? '❌ Errors' : '⚠️ Warnings'}
        </h4>
        <ul className="space-y-1">
          {filteredMessages.map((msg, index) => (
            <li key={index} className={`text-sm ${
              type === 'error' ? 'text-red-700' : 'text-yellow-700'
            }`}>
              <code className="bg-white px-1 rounded">{msg.field}</code>: {msg.message}
            </li>
          ))}
        </ul>
      </div>
    )
  }

  return (
    <div className="max-w-4xl mx-auto p-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            📥 Import JSON Content
          </CardTitle>
          <p className="text-gray-600">
            Import content from quite-post JSON files or paste JSON directly
          </p>
        </CardHeader>
        
        <CardContent className="space-y-6">
          {/* ファイルアップロード */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Upload JSON File
            </label>
            <input
              type="file"
              accept=".json"
              onChange={handleFileUpload}
              className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-medium file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
            />
          </div>

          <div className="text-center text-gray-500">
            or
          </div>

          {/* JSON入力エリア */}
          <Textarea
            label="Paste JSON Content"
            value={jsonInput}
            onChange={(e) => {
              setJsonInput(e.target.value)
              handleValidation(e.target.value)
            }}
            placeholder="Paste your JSON content here..."
            rows={12}
            className="font-mono text-sm"
          />

          {/* 検証結果 */}
          {validationResult && (
            <div className="space-y-4">
              <div className="flex items-center gap-2">
                <Badge variant={validationResult.success ? 'success' : 'danger'}>
                  {validationResult.success ? '✅ Valid' : '❌ Invalid'}
                </Badge>
                {validationResult.warnings.length > 0 && (
                  <Badge variant="warning">
                    ⚠️ {validationResult.warnings.length} Warning(s)
                  </Badge>
                )}
              </div>

              {renderValidationMessages(validationResult.errors, 'error')}
              {renderValidationMessages(validationResult.warnings, 'warning')}
            </div>
          )}

          {/* インポートボタン */}
          <Button
            onClick={handleImport}
            disabled={!validationResult?.success || isImporting}
            loading={isImporting}
            className="w-full"
            size="lg"
          >
            {isImporting ? 'Importing...' : '📥 Import Content'}
          </Button>
        </CardContent>
      </Card>
    </div>
  )
}
```

### 4. インポートプレビューコンポーネント
```typescript
// components/schedule/ImportPreview.tsx
'use client'
import { useAtom } from 'jotai'
import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card'
import { Badge } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import { importedContentAtom, selectedLanguageAtom, selectedPlatformsAtom } from '@/atoms/scheduleAtoms'

export default function ImportPreview() {
  const [importedContent] = useAtom(importedContentAtom)
  const [selectedLanguage, setSelectedLanguage] = useAtom(selectedLanguageAtom)
  const [selectedPlatforms, setSelectedPlatforms] = useAtom(selectedPlatformsAtom)
  const [expandedPlatform, setExpandedPlatform] = useState<string | null>(null)

  if (!importedContent) return null

  const availableLanguages = importedContent.available_languages
  const availablePlatforms = importedContent.available_platforms

  const getContentForLanguageAndPlatform = (language: string, platform: string) => {
    const langData = importedContent.imported_content.languages[language]
    const platformData = langData?.platforms.find(p => p.platform === platform)
    return platformData
  }

  return (
    <div className="mt-8">
      <Card>
        <CardHeader>
          <CardTitle>Imported Content Preview</CardTitle>
          <div className="flex flex-wrap gap-2">
            <Badge variant="default">
              📅 {new Date(importedContent.created_at).toLocaleDateString()}
            </Badge>
            <Badge variant="default">
              🏷️ {importedContent.metadata.category}
            </Badge>
            {importedContent.metadata.tags.map(tag => (
              <Badge key={tag} variant="secondary">
                #{tag}
              </Badge>
            ))}
          </div>
        </CardHeader>
        
        <CardContent className="space-y-6">
          {/* 言語選択 */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-3">
              Select Language
            </label>
            <div className="flex gap-2">
              {availableLanguages.map(lang => (
                <button
                  key={lang}
                  onClick={() => setSelectedLanguage(lang as 'english' | 'japanese')}
                  className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                    selectedLanguage === lang
                      ? 'bg-blue-600 text-white'
                      : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                  }`}
                >
                  {lang === 'english' ? '🇺🇸 English' : '🇯🇵 日本語'}
                </button>
              ))}
            </div>
          </div>

          {/* プラットフォーム選択 */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-3">
              Select Platforms
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {availablePlatforms.map(platform => {
                const content = getContentForLanguageAndPlatform(selectedLanguage, platform)
                const isSelected = selectedPlatforms.includes(platform)
                
                return (
                  <button
                    key={platform}
                    onClick={() => {
                      if (isSelected) {
                        setSelectedPlatforms(prev => prev.filter(p => p !== platform))
                      } else {
                        setSelectedPlatforms(prev => [...prev, platform])
                      }
                    }}
                    disabled={!content}
                    className={`p-4 rounded-lg border-2 transition-all text-left ${
                      !content
                        ? 'border-gray-200 bg-gray-50 opacity-50 cursor-not-allowed'
                        : isSelected
                        ? 'border-blue-500 bg-blue-50'
                        : 'border-gray-200 bg-white hover:border-gray-300'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <span className="font-medium capitalize">{platform}</span>
                      {content && (
                        <Badge variant="secondary">
                          {content.metadata.finalLength} chars
                        </Badge>
                      )}
                    </div>
                    {content ? (
                      <p className="text-sm text-gray-600 truncate">
                        {content.content}
                      </p>
                    ) : (
                      <p className="text-sm text-gray-400">
                        No content available for {selectedLanguage}
                      </p>
                    )}
                  </button>
                )
              })}
            </div>
          </div>

          {/* 選択されたコンテンツのプレビュー */}
          {selectedPlatforms.length > 0 && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-3">
                Content Preview
              </label>
              <div className="space-y-4">
                {selectedPlatforms.map(platform => {
                  const content = getContentForLanguageAndPlatform(selectedLanguage, platform)
                  if (!content) return null

                  const isExpanded = expandedPlatform === platform
                  
                  return (
                    <div key={platform} className="border rounded-lg">
                      <div 
                        className="p-4 cursor-pointer hover:bg-gray-50"
                        onClick={() => setExpandedPlatform(isExpanded ? null : platform)}
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <Badge variant="default" className="capitalize">
                              {platform}
                            </Badge>
                            <span className="text-sm text-gray-500">
                              {content.metadata.finalLength} characters
                            </span>
                          </div>
                          <span className="text-gray-400">
                            {isExpanded ? '▼' : '▶'}
                          </span>
                        </div>
                      </div>
                      
                      {isExpanded && (
                        <div className="px-4 pb-4">
                          <div className="bg-gray-50 rounded-lg p-4">
                            <pre className="whitespace-pre-wrap text-sm text-gray-800 font-mono">
                              {content.content}
                            </pre>
                          </div>
                          
                          <div className="mt-3 grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs text-gray-500">
                            <div>Model: {content.metadata.model}</div>
                            <div>Tokens: {content.metadata.tokens}</div>
                            <div>Cost: ${content.metadata.cost}</div>
                            <div>Original: {content.metadata.originalLength}</div>
                          </div>
                        </div>
                      )}
                    </div>
                  )
                })}
              </div>
            </div>
          )}

          {/* 次のステップボタン */}
          {selectedPlatforms.length > 0 && (
            <div className="pt-6 border-t border-gray-200">
              <Button className="w-full" size="lg">
                📅 Continue to Scheduling
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
```

## 完了条件
- [x] JSON型定義が完全に実装済み
- [x] JSON検証ユーティリティが実装済み
- [x] JSONインポートコンポーネントが実装済み
- [x] インポートプレビューコンポーネントが実装済み
- [x] ファイルアップロード機能が実装済み
- [x] エラー・警告表示が実装済み
- [x] 言語・プラットフォーム選択が実装済み
- [x] quite-post JSON形式との完全互換性確認済み

## 関連ファイル
- `types/import.ts`
- `lib/jsonValidator.ts`
- `components/schedule/JSONImporter.tsx`
- `components/schedule/ImportPreview.tsx`

## 見積もり時間
5-6時間

## 注意事項
- quite-post JSONフォーマットとの完全互換性を保つ
- 堅牢なエラーハンドリングを実装
- ユーザーフレンドリーなエラーメッセージ
- パフォーマンスを考慮したプレビュー表示
- セキュリティ（JSONインジェクション対策）