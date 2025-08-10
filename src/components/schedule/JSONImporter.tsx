'use client'

import { useState } from 'react'
import { useAtom } from 'jotai'
import { useTranslations } from 'next-intl'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Textarea } from '@/components/ui/Textarea'
import { Badge } from '@/components/ui/Badge'
import { validateImportedJSON, formatContentForScheduling, getContentStats } from '@/lib/jsonValidator'
import { importedContentAtom } from '@/atoms/scheduleAtoms'
import { ImportResult, ValidationError } from '@/types/import'

interface JSONImporterProps {
  locale: string
}

export default function JSONImporter({ 
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  locale 
}: JSONImporterProps) {
  const t = useTranslations('import.importer')
  const [, setImportedContent] = useAtom(importedContentAtom)
  const [jsonInput, setJsonInput] = useState('')
  const [validationResult, setValidationResult] = useState<ImportResult | null>(null)
  const [isImporting, setIsImporting] = useState(false)
  const [fileName, setFileName] = useState<string | null>(null)

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    setFileName(file.name)

    if (file.type !== 'application/json' && !file.name.endsWith('.json')) {
      setValidationResult({
        success: false,
        errors: [{
          field: 'file',
          message: t('fileError'),
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
    reader.onerror = () => {
      setValidationResult({
        success: false,
        errors: [{
          field: 'file',
          message: t('fileReadError'),
          severity: 'error'
        }],
        warnings: []
      })
    }
    reader.readAsText(file)
  }

  const handleValidation = (jsonString: string) => {
    if (!jsonString.trim()) {
      setValidationResult(null)
      return
    }

    try {
      const result = validateImportedJSON(jsonString)
      setValidationResult(result)
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    } catch (error) {
      setValidationResult({
        success: false,
        errors: [{
          field: 'validation',
          message: t('validationError'),
          severity: 'error'
        }],
        warnings: []
      })
    }
  }

  const handleImport = async () => {
    if (!validationResult?.success || !validationResult.data) return

    setIsImporting(true)
    
    try {
      const formattedContent = formatContentForScheduling(validationResult.data)
      const stats = getContentStats(validationResult.data)
      
      setImportedContent(formattedContent)
      
      console.log('Import successful:', stats)
      
      // インポート完了後にリセット
      setTimeout(() => {
        setIsImporting(false)
        setJsonInput('')
        setValidationResult(null)
        setFileName(null)
      }, 1000)
      
    } catch (error) {
      console.error('Import failed:', error)
      alert('Import failed: ' + error)
      setIsImporting(false)
    }
  }

  const handleReset = () => {
    setJsonInput('')
    setValidationResult(null)
    setFileName(null)
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
          {type === 'error' ? `❌ ${t('errors')}` : `⚠️ ${t('warnings')}`}
        </h4>
        <ul className="space-y-1">
          {filteredMessages.map((msg, index) => (
            <li key={index} className={`text-sm ${
              type === 'error' ? 'text-red-700' : 'text-yellow-700'
            }`}>
              <code className="bg-white px-1 rounded text-xs">{msg.field}</code>: {msg.message}
            </li>
          ))}
        </ul>
      </div>
    )
  }

  const renderContentStats = () => {
    if (!validationResult?.data) return null
    
    const stats = getContentStats(validationResult.data)
    
    return (
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 p-4 bg-blue-50 rounded-lg">
        <div className="text-center">
          <div className="text-lg font-bold text-blue-600">{stats.languages}</div>
          <div className="text-xs text-gray-600">{t('languages')}</div>
        </div>
        <div className="text-center">
          <div className="text-lg font-bold text-blue-600">{stats.totalPlatforms}</div>
          <div className="text-xs text-gray-600">{t('platforms')}</div>
        </div>
        <div className="text-center">
          <div className="text-lg font-bold text-blue-600">{stats.totalCharacters.toLocaleString()}</div>
          <div className="text-xs text-gray-600">{t('characters')}</div>
        </div>
        <div className="text-center">
          <div className="text-lg font-bold text-blue-600">${stats.totalCost}</div>
          <div className="text-xs text-gray-600">{t('totalCost')}</div>
        </div>
      </div>
    )
  }

  return (
    <div className="max-w-4xl mx-auto p-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            📥 {t('cardTitle')}
          </CardTitle>
          <p className="text-gray-600">
            {t('cardDescription')}
          </p>
        </CardHeader>
        
        <CardContent className="space-y-6">
          {/* ファイルアップロード */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              {t('uploadLabel')}
            </label>
            <input
              type="file"
              accept=".json,application/json"
              onChange={handleFileUpload}
              className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-medium file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100 cursor-pointer"
            />
            {fileName && (
              <p className="mt-1 text-sm text-gray-500">
                {t('selectedFile')}: {fileName}
              </p>
            )}
          </div>

          <div className="text-center text-gray-500 font-medium">
            {t('or')}
          </div>

          {/* JSON入力エリア */}
          <div>
            <Textarea
              label={t('pasteLabel')}
              value={jsonInput}
              onChange={(e) => {
                setJsonInput(e.target.value)
                handleValidation(e.target.value)
              }}
              placeholder={t('placeholder')}
              rows={12}
              className="font-mono text-sm"
            />
          </div>

          {/* 検証結果 */}
          {validationResult && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Badge variant={validationResult.success ? 'success' : 'danger'}>
                    {validationResult.success ? `✅ ${t('validJson')}` : `❌ ${t('invalidJson')}`}
                  </Badge>
                  {validationResult.warnings.length > 0 && (
                    <Badge variant="warning">
                      ⚠️ {validationResult.warnings.length} {t('warnings')}
                    </Badge>
                  )}
                  {validationResult.errors.length > 0 && (
                    <Badge variant="danger">
                      ❌ {validationResult.errors.length} {t('errors')}
                    </Badge>
                  )}
                </div>
                <Button variant="ghost" size="sm" onClick={handleReset}>
                  {t('clear')}
                </Button>
              </div>

              {validationResult.success && renderContentStats()}
              {renderValidationMessages(validationResult.errors, 'error')}
              {renderValidationMessages(validationResult.warnings, 'warning')}
            </div>
          )}

          {/* インポートボタン */}
          <div className="flex gap-3">
            <Button
              onClick={handleImport}
              disabled={!validationResult?.success || isImporting}
              loading={isImporting}
              className="flex-1"
              size="lg"
            >
              {isImporting ? t('importing') : `📥 ${t('importButton')}`}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}