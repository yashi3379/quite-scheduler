interface OptimalTimeRequest {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  content: any
  platforms: string[]
  targetAudience?: 'global' | 'us' | 'japan' | 'europe'
  contentType?: 'tech' | 'business' | 'lifestyle' | 'news'
}

interface OptimalTimeSuggestion {
  time: string // ISO string
  reason: string
  confidence: 'high' | 'medium' | 'low'
  timezone: string
  expectedEngagement: number // 0-100
  competitionLevel: 'high' | 'medium' | 'low'
}

export async function suggestOptimalTimes(request: OptimalTimeRequest): Promise<OptimalTimeSuggestion[]> {
  const { platforms, targetAudience = 'global', contentType = 'tech' } = request
  
  const suggestions: OptimalTimeSuggestion[] = []
  
  // プラットフォーム別の最適化ロジック
  for (const platform of platforms) {
    switch (platform.toLowerCase()) {
      case 'twitter':
        suggestions.push(...getTwitterOptimalTimes(targetAudience, contentType))
        break
      case 'reddit':
        suggestions.push(...getRedditOptimalTimes(targetAudience, contentType))
        break
      case 'threads':
        suggestions.push(...getThreadsOptimalTimes(targetAudience, contentType))
        break
      default:
        suggestions.push(...getGenericOptimalTimes(targetAudience, contentType, platform))
        break
    }
  }
  
  // 重複排除と信頼度順ソート
  return deduplicateAndSort(suggestions)
}

function getTwitterOptimalTimes(audience: string, contentType: string): OptimalTimeSuggestion[] {
  const now = new Date()
  const suggestions: OptimalTimeSuggestion[] = []
  
  // 基本的な最適時間パターン
  const basePatterns = {
    global: [
      { hour: 9, confidence: 'high' as const, reason: 'Morning commute time globally' },
      { hour: 14, confidence: 'high' as const, reason: 'Lunch break engagement peak' },
      { hour: 21, confidence: 'medium' as const, reason: 'Evening leisure time' }
    ],
    us: [
      { hour: 9, confidence: 'high' as const, reason: 'US East Coast morning' },
      { hour: 14, confidence: 'high' as const, reason: 'US lunch time peak' },
      { hour: 17, confidence: 'medium' as const, reason: 'US evening commute' }
    ],
    japan: [
      { hour: 7, confidence: 'high' as const, reason: 'Japan morning commute' },
      { hour: 12, confidence: 'high' as const, reason: 'Japan lunch break' },
      { hour: 21, confidence: 'high' as const, reason: 'Japan evening peak' }
    ],
    europe: [
      { hour: 8, confidence: 'high' as const, reason: 'Europe morning start' },
      { hour: 13, confidence: 'high' as const, reason: 'Europe lunch peak' },
      { hour: 19, confidence: 'medium' as const, reason: 'Europe evening time' }
    ]
  }
  
  const patterns = basePatterns[audience as keyof typeof basePatterns] || basePatterns.global
  
  patterns.forEach(pattern => {
    const suggestionTime = new Date(now)
    suggestionTime.setHours(pattern.hour, 0, 0, 0)
    
    // 過去の時間なら翌日に設定
    if (suggestionTime <= now) {
      suggestionTime.setDate(suggestionTime.getDate() + 1)
    }
    
    suggestions.push({
      time: suggestionTime.toISOString(),
      reason: pattern.reason,
      confidence: pattern.confidence,
      timezone: getTimezoneForAudience(audience),
      expectedEngagement: calculateExpectedEngagement('twitter', pattern.hour, contentType),
      competitionLevel: calculateCompetitionLevel('twitter', pattern.hour)
    })
  })
  
  return suggestions
}

function getRedditOptimalTimes(audience: string, contentType: string): OptimalTimeSuggestion[] {
  const now = new Date()
  const suggestions: OptimalTimeSuggestion[] = []
  
  // Reddit特有の最適時間（平日の朝と夕方）
  const redditPatterns = [
    { hour: 8, confidence: 'high' as const, reason: 'Reddit morning browsing peak' },
    { hour: 16, confidence: 'high' as const, reason: 'Reddit afternoon engagement' },
    { hour: 20, confidence: 'medium' as const, reason: 'Reddit evening discussion time' }
  ]
  
  redditPatterns.forEach(pattern => {
    const suggestionTime = new Date(now)
    suggestionTime.setHours(pattern.hour, 0, 0, 0)
    
    if (suggestionTime <= now) {
      suggestionTime.setDate(suggestionTime.getDate() + 1)
    }
    
    suggestions.push({
      time: suggestionTime.toISOString(),
      reason: pattern.reason,
      confidence: pattern.confidence,
      timezone: getTimezoneForAudience(audience),
      expectedEngagement: calculateExpectedEngagement('reddit', pattern.hour, contentType),
      competitionLevel: calculateCompetitionLevel('reddit', pattern.hour)
    })
  })
  
  return suggestions
}

function getThreadsOptimalTimes(audience: string, contentType: string): OptimalTimeSuggestion[] {
  // Threadsは比較的新しいプラットフォームなので、Instagramパターンを基準
  const now = new Date()
  const suggestions: OptimalTimeSuggestion[] = []
  
  const threadsPatterns = [
    { hour: 11, confidence: 'medium' as const, reason: 'Threads mid-morning engagement' },
    { hour: 15, confidence: 'high' as const, reason: 'Threads afternoon peak' },
    { hour: 19, confidence: 'high' as const, reason: 'Threads evening social time' }
  ]
  
  threadsPatterns.forEach(pattern => {
    const suggestionTime = new Date(now)
    suggestionTime.setHours(pattern.hour, 0, 0, 0)
    
    if (suggestionTime <= now) {
      suggestionTime.setDate(suggestionTime.getDate() + 1)
    }
    
    suggestions.push({
      time: suggestionTime.toISOString(),
      reason: pattern.reason,
      confidence: pattern.confidence,
      timezone: getTimezoneForAudience(audience),
      expectedEngagement: calculateExpectedEngagement('threads', pattern.hour, contentType),
      competitionLevel: calculateCompetitionLevel('threads', pattern.hour)
    })
  })
  
  return suggestions
}

function getGenericOptimalTimes(audience: string, contentType: string, platform: string): OptimalTimeSuggestion[] {
  const now = new Date()
  const suggestions: OptimalTimeSuggestion[] = []
  
  // 汎用的な最適時間
  const genericPatterns = [
    { hour: 10, confidence: 'medium' as const, reason: `${platform} mid-morning activity` },
    { hour: 14, confidence: 'medium' as const, reason: `${platform} afternoon engagement` },
    { hour: 20, confidence: 'medium' as const, reason: `${platform} evening activity` }
  ]
  
  genericPatterns.forEach(pattern => {
    const suggestionTime = new Date(now)
    suggestionTime.setHours(pattern.hour, 0, 0, 0)
    
    if (suggestionTime <= now) {
      suggestionTime.setDate(suggestionTime.getDate() + 1)
    }
    
    suggestions.push({
      time: suggestionTime.toISOString(),
      reason: pattern.reason,
      confidence: pattern.confidence,
      timezone: getTimezoneForAudience(audience),
      expectedEngagement: calculateExpectedEngagement(platform, pattern.hour, contentType),
      competitionLevel: calculateCompetitionLevel(platform, pattern.hour)
    })
  })
  
  return suggestions
}

function getTimezoneForAudience(audience: string): string {
  const timezones = {
    global: 'UTC',
    us: 'America/New_York',
    japan: 'Asia/Tokyo',
    europe: 'Europe/London'
  }
  return timezones[audience as keyof typeof timezones] || 'UTC'
}

function calculateExpectedEngagement(platform: string, hour: number, contentType: string): number {
  // 簡単な計算ロジック（実際にはより複雑なアルゴリズムが必要）
  const baseEngagement: Record<string, number> = {
    twitter: 65,
    reddit: 70,
    threads: 60,
    linkedin: 55,
    facebook: 50
  }
  
  const hourModifier = Math.max(0.3, Math.sin((hour - 6) * Math.PI / 12))
  const contentModifier = contentType === 'tech' ? 1.1 : 1.0
  
  return Math.round((baseEngagement[platform.toLowerCase()] || 60) * hourModifier * contentModifier)
}

function calculateCompetitionLevel(platform: string, hour: number): 'high' | 'medium' | 'low' {
  // 一般的なピーク時間は競争が激しい
  const peakHours = [9, 12, 14, 17, 21]
  
  if (peakHours.includes(hour)) return 'high'
  if (hour >= 8 && hour <= 22) return 'medium'
  return 'low'
}

function deduplicateAndSort(suggestions: OptimalTimeSuggestion[]): OptimalTimeSuggestion[] {
  // 時間で重複排除
  const uniqueSuggestions = suggestions.reduce((acc, current) => {
    const exists = acc.find(item => 
      Math.abs(new Date(item.time).getTime() - new Date(current.time).getTime()) < 60 * 60 * 1000 // 1時間以内
    )
    
    if (!exists) {
      acc.push(current)
    } else if (current.expectedEngagement > exists.expectedEngagement) {
      // より高いエンゲージメントが期待できる場合は置き換え
      const index = acc.indexOf(exists)
      acc[index] = current
    }
    
    return acc
  }, [] as OptimalTimeSuggestion[])
  
  // 信頼度と期待エンゲージメントでソート
  return uniqueSuggestions.sort((a, b) => {
    const confidenceScore = { high: 3, medium: 2, low: 1 }
    const aScore = confidenceScore[a.confidence] * a.expectedEngagement
    const bScore = confidenceScore[b.confidence] * b.expectedEngagement
    return bScore - aScore
  }).slice(0, 5) // 上位5つの提案のみ
}

export type { OptimalTimeRequest, OptimalTimeSuggestion }