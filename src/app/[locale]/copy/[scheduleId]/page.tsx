import { Suspense } from 'react'
import CopyPageWrapper from '@/components/copy/CopyPageWrapper'
import { Spinner } from '@/components/ui/Spinner'

interface CopyPageProps {
  params: Promise<{
    locale: string
    scheduleId: string
  }>
  searchParams: Promise<{
    token?: string
  }>
}

export async function generateMetadata({ params, searchParams }: CopyPageProps) {
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const { scheduleId } = await params
  const { token } = await searchParams

  if (!token) {
    return {
      title: 'Access Required - Quite Scheduler',
      description: 'Valid access token required to view content'
    }
  }

  try {
    // Simple validation - in production, implement proper validateAccessToken
    // const { schedule } = await validateAccessToken(scheduleId, token)
    const schedule = { imported_content: { metadata: { title: 'Content' } }, selected_platforms: ['twitter'] }
    const contentTitle = schedule.imported_content?.metadata?.title || 'Scheduled Content'
    
    return {
      title: `Copy: ${contentTitle} - Quite Scheduler`,
      description: `Copy content for ${schedule.selected_platforms.join(', ')}`,
      robots: 'noindex, nofollow', // セキュリティのため検索エンジンに登録させない
    }
  } catch {
    return {
      title: 'Content Not Found - Quite Scheduler',
      description: 'The requested content could not be found'
    }
  }
}

function LoadingSpinner() {
  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <div className="text-center">
        <Spinner size="lg" />
        <p className="mt-4 text-gray-600">Loading content...</p>
      </div>
    </div>
  )
}

function AccessDeniedPage() {
  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-lg shadow-lg p-8 max-w-md w-full text-center">
        <div className="text-red-500 text-6xl mb-4">🔒</div>
        <h1 className="text-2xl font-bold text-gray-900 mb-2">Access Required</h1>
        <p className="text-gray-600 mb-4">
          A valid access token is required to view this content.
        </p>
        <p className="text-sm text-gray-500 mb-6">
          Please use the link provided in your calendar notification or scheduling system.
        </p>
        <div className="bg-blue-50 rounded-lg p-4 text-left">
          <h3 className="font-medium text-blue-900 mb-2">💡 How to access:</h3>
          <ul className="text-sm text-blue-700 space-y-1">
            <li>• Check your Google Calendar event</li>
            <li>• Use the link from scheduling confirmation</li>
            <li>• Ensure the URL includes the token parameter</li>
          </ul>
        </div>
      </div>
    </div>
  )
}

function ContentNotFoundPage() {
  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-lg shadow-lg p-8 max-w-md w-full text-center">
        <div className="text-gray-400 text-6xl mb-4">📄</div>
        <h1 className="text-2xl font-bold text-gray-900 mb-2">Content Not Found</h1>
        <p className="text-gray-600 mb-4">
          The requested content could not be found or may have expired.
        </p>
        <div className="bg-yellow-50 rounded-lg p-4 text-left">
          <h3 className="font-medium text-yellow-900 mb-2">⚠️ Possible reasons:</h3>
          <ul className="text-sm text-yellow-700 space-y-1">
            <li>• Invalid or expired access token</li>
            <li>• Content has been deleted</li>
            <li>• Incorrect schedule ID in URL</li>
          </ul>
        </div>
      </div>
    </div>
  )
}

export default async function CopyPage({ params, searchParams }: CopyPageProps) {
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const { locale, scheduleId } = await params
  const { token } = await searchParams

  // トークンが必要
  if (!token) {
    return <AccessDeniedPage />
  }

  // 簡単なトークン検証（本来はより複雑な検証が必要）
  if (token !== 'simple_access') {
    return <ContentNotFoundPage />
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Suspense fallback={<LoadingSpinner />}>
        <CopyPageWrapper scheduleId={scheduleId} />
      </Suspense>
    </div>
  )
}