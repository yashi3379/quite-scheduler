'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/Button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card'
import { Badge } from '@/components/ui/Badge'

interface PlatformContentProps {
  platform: {
    platform: string
    content: string
    metadata: {
      finalLength: number
      tokens?: number
      model?: string
      originalLength?: number
    }
  }
  onCopy: (platform: string, content: string) => Promise<void>
  copyStatus?: string
}

export default function PlatformContent({ platform, onCopy, copyStatus }: PlatformContentProps) {
  const [isLoading, setIsLoading] = useState(false)

  const handleCopy = async () => {
    setIsLoading(true)
    try {
      await onCopy(platform.platform, platform.content)
    } finally {
      setIsLoading(false)
    }
  }

  const getPlatformName = (platformKey: string) => {
    const names: Record<string, string> = {
      twitter: 'Twitter',
      reddit: 'Reddit',
      threads: 'Threads',
      linkedin: 'LinkedIn',
      facebook: 'Facebook'
    }
    return names[platformKey] || platformKey.charAt(0).toUpperCase() + platformKey.slice(1)
  }

  const getPlatformIcon = (platformKey: string) => {
    const icons: Record<string, string> = {
      twitter: '🐦',
      reddit: '📮',
      threads: '🧵',
      linkedin: '💼',
      facebook: '📘'
    }
    return icons[platformKey] || '📱'
  }

  const getPlatformColor = (platformKey: string) => {
    const colors: Record<string, string> = {
      twitter: 'bg-blue-500',
      reddit: 'bg-orange-500',
      threads: 'bg-black',
      linkedin: 'bg-blue-700',
      facebook: 'bg-blue-600'
    }
    return colors[platformKey] || 'bg-gray-500'
  }

  const getCharacterLimit = (platformKey: string) => {
    const limits: Record<string, number> = {
      twitter: 280,
      reddit: 40000,
      threads: 500,
      linkedin: 3000,
      facebook: 63206
    }
    return limits[platformKey] || 1000
  }

  const characterLimit = getCharacterLimit(platform.platform)
  const isOverLimit = platform.metadata.finalLength > characterLimit
  const utilizationPercentage = Math.round((platform.metadata.finalLength / characterLimit) * 100)

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className={`w-3 h-3 rounded-full ${getPlatformColor(platform.platform)}`} />
            <span className="flex items-center gap-2">
              <span>{getPlatformIcon(platform.platform)}</span>
              <span>{getPlatformName(platform.platform)}</span>
            </span>
          </div>
          
          <div className="flex items-center gap-2">
            <Badge 
              variant={isOverLimit ? "danger" : utilizationPercentage > 90 ? "warning" : "default"}
              className="text-xs"
            >
              {platform.metadata.finalLength}/{characterLimit} ({utilizationPercentage}%)
            </Badge>
            {copyStatus === 'copied' && (
              <Badge variant="success" className="text-xs">
                ✓ Copied
              </Badge>
            )}
          </div>
        </CardTitle>
      </CardHeader>
      
      <CardContent className="space-y-4">
        {/* コンテンツプレビュー */}
        <div 
          className={`relative bg-gray-50 rounded-lg p-4 border-2 transition-all cursor-pointer hover:border-blue-300 ${
            copyStatus === 'copied' 
              ? 'border-green-300 bg-green-50' 
              : 'border-gray-200'
          }`}
          onClick={handleCopy}
        >
          <div className="absolute top-2 right-2">
            {copyStatus === 'copied' ? (
              <span className="text-green-600 text-xl">✓</span>
            ) : (
              <span className="text-gray-400 text-xl hover:text-blue-500 transition-colors">📋</span>
            )}
          </div>
          
          <div className="pr-8">
            <pre className="whitespace-pre-wrap font-sans text-sm text-gray-800 leading-relaxed">
              {platform.content}
            </pre>
          </div>
          
          {isOverLimit && (
            <div className="mt-3 text-xs text-red-600 bg-red-50 rounded p-2 border border-red-200">
              ⚠️ Content exceeds {getPlatformName(platform.platform)} character limit by {platform.metadata.finalLength - characterLimit} characters
            </div>
          )}

          {/* タップヒント（モバイル対応） */}
          <div className="absolute bottom-2 left-2 text-xs text-gray-400 opacity-0 hover:opacity-100 transition-opacity">
            📱 Tap to copy
          </div>
        </div>

        {/* コピーボタン */}
        <Button
          onClick={handleCopy}
          loading={isLoading}
          disabled={isLoading}
          className={`w-full transition-all ${
            copyStatus === 'copied'
              ? 'bg-green-600 hover:bg-green-700 text-white'
              : 'bg-blue-600 hover:bg-blue-700 text-white'
          }`}
          size="lg"
        >
          <div className="flex items-center justify-center gap-2">
            {isLoading ? (
              <>
                <span className="animate-spin">⏳</span>
                <span>Copying...</span>
              </>
            ) : copyStatus === 'copied' ? (
              <>
                <span>✓</span>
                <span>Copied to Clipboard</span>
              </>
            ) : (
              <>
                <span>📋</span>
                <span>Copy to Clipboard</span>
              </>
            )}
          </div>
        </Button>

        {/* メタデータ */}
        <div className="grid grid-cols-2 gap-4 pt-3 border-t border-gray-200">
          <div className="text-xs text-gray-500">
            <div className="font-medium mb-1">Content Stats</div>
            <div>Characters: {platform.metadata.finalLength.toLocaleString()}</div>
            {platform.metadata.originalLength && (
              <div>Original: {platform.metadata.originalLength.toLocaleString()}</div>
            )}
          </div>
          
          <div className="text-xs text-gray-500">
            <div className="font-medium mb-1">Generation Info</div>
            {platform.metadata.tokens && (
              <div>Tokens: {platform.metadata.tokens.toLocaleString()}</div>
            )}
            {platform.metadata.model && (
              <div>Model: {platform.metadata.model}</div>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  )
}