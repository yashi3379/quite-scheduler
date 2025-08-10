'use client'

import { useAtom } from 'jotai'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useTranslations } from 'next-intl'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card'
import { Badge } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import { importedContentAtom, selectedLanguageAtom, selectedPlatformsAtom } from '@/atoms/scheduleAtoms'
import { getContentStats } from '@/lib/jsonValidator'

interface ImportPreviewProps {
  locale: string
}

export default function ImportPreview({ locale }: ImportPreviewProps) {
  const t = useTranslations('import.preview')
  const router = useRouter()
  const [importedContent] = useAtom(importedContentAtom)
  const [selectedLanguage, setSelectedLanguage] = useAtom(selectedLanguageAtom)
  const [selectedPlatforms, setSelectedPlatforms] = useAtom(selectedPlatformsAtom)
  const [expandedPlatform, setExpandedPlatform] = useState<string | null>(null)

  if (!importedContent) return null

  const availableLanguages = importedContent.available_languages
  const availablePlatforms = importedContent.available_platforms
  const stats = getContentStats(importedContent.imported_content)

  const getContentForLanguageAndPlatform = (language: string, platform: string) => {
    const langData = importedContent.imported_content.languages[language as keyof typeof importedContent.imported_content.languages]
    const platformData = langData?.platforms.find(p => p.platform === platform)
    return platformData
  }

  const getPlatformIcon = (platform: string) => {
    switch (platform.toLowerCase()) {
      case 'twitter': return '🐦'
      case 'threads': return '🧵'
      case 'reddit': return '🔴'
      case 'linkedin': return '💼'
      case 'facebook': return '📘'
      default: return '📱'
    }
  }

  const getPlatformColor = (platform: string) => {
    switch (platform.toLowerCase()) {
      case 'twitter': return 'bg-blue-500'
      case 'threads': return 'bg-black'
      case 'reddit': return 'bg-orange-500'
      case 'linkedin': return 'bg-blue-700'
      case 'facebook': return 'bg-blue-600'
      default: return 'bg-gray-500'
    }
  }

  return (
    <div className="mt-8">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            🎯 {t('cardTitle')}
          </CardTitle>
          <div className="flex flex-wrap gap-2 mt-2">
            <Badge variant="default">
              📅 {new Date(importedContent.created_at).toLocaleDateString()}
            </Badge>
            <Badge variant="default">
              🏷️ {importedContent.metadata.category}
            </Badge>
            <Badge variant="default">
              📊 {stats.totalPlatforms} {t('platforms')}
            </Badge>
            <Badge variant="default">
              💬 {stats.totalCharacters.toLocaleString()} chars
            </Badge>
            {importedContent.metadata.tags?.map(tag => (
              <Badge key={tag} variant="default">
                #{tag}
              </Badge>
            ))}
          </div>
        </CardHeader>
        
        <CardContent className="space-y-6">
          {/* メタデータ表示 */}
          <div className="bg-gray-50 rounded-lg p-4">
            <h3 className="font-semibold text-gray-800 mb-2">📋 {t('contentInfo')}</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
              <div>
                <span className="font-medium text-gray-600">{t('title')}:</span>
                <span className="ml-2">{importedContent.metadata.title}</span>
              </div>
              <div>
                <span className="font-medium text-gray-600">{t('priority')}:</span>
                <span className="ml-2 capitalize">{importedContent.metadata.priority}</span>
              </div>
              <div>
                <span className="font-medium text-gray-600">{t('contentId')}:</span>
                <span className="ml-2 font-mono text-xs">{importedContent.content_id}</span>
              </div>
              <div>
                <span className="font-medium text-gray-600">{t('cost')}:</span>
                <span className="ml-2">${stats.totalCost}</span>
              </div>
            </div>
          </div>

          {/* 言語選択 */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-3">
              🌐 {t('selectLanguage')}
            </label>
            <div className="flex gap-2">
              {availableLanguages.map(lang => (
                <button
                  key={lang}
                  onClick={() => setSelectedLanguage(lang as 'english' | 'japanese')}
                  className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                    selectedLanguage === lang
                      ? 'bg-blue-600 text-white shadow-md'
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
              📱 {t('selectPlatforms')} ({selectedPlatforms.length} {t('selected')})
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {availablePlatforms.map(platform => {
                const content = getContentForLanguageAndPlatform(selectedLanguage, platform)
                const isSelected = selectedPlatforms.includes(platform)
                const isAvailable = !!content
                
                return (
                  <button
                    key={platform}
                    onClick={() => {
                      if (!isAvailable) return
                      if (isSelected) {
                        setSelectedPlatforms(prev => prev.filter(p => p !== platform))
                      } else {
                        setSelectedPlatforms(prev => [...prev, platform])
                      }
                    }}
                    disabled={!isAvailable}
                    className={`p-4 rounded-lg border-2 transition-all text-left relative overflow-hidden ${
                      !isAvailable
                        ? 'border-gray-200 bg-gray-50 opacity-50 cursor-not-allowed'
                        : isSelected
                        ? 'border-blue-500 bg-blue-50 shadow-md'
                        : 'border-gray-200 bg-white hover:border-gray-300 hover:shadow-sm'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <span className="text-lg">{getPlatformIcon(platform)}</span>
                        <span className="font-medium capitalize">{platform}</span>
                      </div>
                      {isSelected && (
                        <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                      )}
                    </div>
                    
                    {content ? (
                      <>
                        <p className="text-sm text-gray-600 truncate mb-2">
                          {content.content}
                        </p>
                        <div className="flex items-center justify-between text-xs text-gray-500">
                          <span>{content.metadata.finalLength} chars</span>
                          <span>{content.metadata.tokens} tokens</span>
                        </div>
                      </>
                    ) : (
                      <p className="text-sm text-gray-400">
                        {selectedLanguage}では{t('noContent')}
                      </p>
                    )}
                    
                    {/* プラットフォームカラーアクセント */}
                    <div className={`absolute top-0 left-0 w-1 h-full ${getPlatformColor(platform)}`}></div>
                  </button>
                )
              })}
            </div>
          </div>

          {/* 選択されたコンテンツのプレビュー */}
          {selectedPlatforms.length > 0 && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-3">
                👀 {t('contentPreview')} ({selectedPlatforms.length} {t('platforms')})
              </label>
              <div className="space-y-3">
                {selectedPlatforms.map(platform => {
                  const content = getContentForLanguageAndPlatform(selectedLanguage, platform)
                  if (!content) return null

                  const isExpanded = expandedPlatform === platform
                  
                  return (
                    <div key={platform} className="border rounded-lg overflow-hidden">
                      <div 
                        className="p-4 cursor-pointer hover:bg-gray-50 transition-colors"
                        onClick={() => setExpandedPlatform(isExpanded ? null : platform)}
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <span className="text-lg">{getPlatformIcon(platform)}</span>
                            <div>
                              <Badge variant="default" className="capitalize">
                                {platform}
                              </Badge>
                              <span className="ml-2 text-sm text-gray-500">
                                {content.metadata.finalLength} characters
                              </span>
                            </div>
                          </div>
                          <span className="text-gray-400 text-lg">
                            {isExpanded ? '▼' : '▶'}
                          </span>
                        </div>
                      </div>
                      
                      {isExpanded && (
                        <div className="px-4 pb-4 border-t border-gray-100">
                          <div className="bg-gray-50 rounded-lg p-4 mt-3">
                            <div className="whitespace-pre-wrap text-sm text-gray-800 leading-relaxed">
                              {content.content}
                            </div>
                          </div>
                          
                          <div className="mt-3 grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs text-gray-500">
                            <div className="bg-white rounded px-2 py-1">
                              <span className="font-medium">{t('model')}:</span>
                              <div className="font-mono">{content.metadata.model}</div>
                            </div>
                            <div className="bg-white rounded px-2 py-1">
                              <span className="font-medium">{t('tokens')}:</span>
                              <div>{content.metadata.tokens.toLocaleString()}</div>
                            </div>
                            <div className="bg-white rounded px-2 py-1">
                              <span className="font-medium">{t('cost')}:</span>
                              <div>${content.metadata.cost}</div>
                            </div>
                            <div className="bg-white rounded px-2 py-1">
                              <span className="font-medium">{t('original')}:</span>
                              <div>{content.metadata.originalLength} chars</div>
                            </div>
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
              <div className="flex items-center justify-between p-4 bg-blue-50 rounded-lg">
                <div>
                  <div className="font-semibold text-blue-900">{t('readyForScheduling')}</div>
                  <div className="text-sm text-blue-700">
                    {selectedPlatforms.length}{t('platformsSelectedIn')} {selectedLanguage}
                  </div>
                </div>
                <Button 
                  size="lg" 
                  className="px-8"
                  onClick={() => router.push(`/${locale}/schedule`)}
                >
                  📅 {t('continueToScheduling')} →
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}