'use client'

import dynamic from 'next/dynamic'

// Dynamically import components to avoid SSR issues
const JSONImporter = dynamic(() => import('@/components/schedule/JSONImporter'), { ssr: false })
const ImportPreview = dynamic(() => import('@/components/schedule/ImportPreview'), { ssr: false })
const PostScheduler = dynamic(() => import('@/components/schedule/PostScheduler'), { ssr: false })

export default function TestImportPage() {
  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-6xl mx-auto px-4">
        <div className="mb-8 text-center">
          <h1 className="text-3xl font-bold text-gray-900 mb-4">
            📥 Import → Schedule Test
          </h1>
          <p className="text-gray-600 max-w-2xl mx-auto">
            Complete workflow test: Import JSON content, preview & select platforms, then schedule posts with AI optimization.
          </p>
        </div>
        
        <div className="space-y-8">
          {/* Step 1: JSONインポーター */}
          <div>
            <div className="flex items-center gap-2 mb-4">
              <span className="w-8 h-8 bg-blue-600 text-white rounded-full flex items-center justify-center text-sm font-bold">1</span>
              <h2 className="text-xl font-semibold text-gray-900">Import Content</h2>
            </div>
            <JSONImporter locale="ja" />
          </div>
          
          {/* Step 2: インポートプレビュー */}
          <div>
            <div className="flex items-center gap-2 mb-4">
              <span className="w-8 h-8 bg-blue-600 text-white rounded-full flex items-center justify-center text-sm font-bold">2</span>
              <h2 className="text-xl font-semibold text-gray-900">Preview & Select</h2>
            </div>
            <ImportPreview locale="ja" />
          </div>
          
          {/* Step 3: スケジューリング */}
          <div>
            <div className="flex items-center gap-2 mb-4">
              <span className="w-8 h-8 bg-blue-600 text-white rounded-full flex items-center justify-center text-sm font-bold">3</span>
              <h2 className="text-xl font-semibold text-gray-900">Schedule Posts</h2>
            </div>
            <PostScheduler locale="ja" />
          </div>
        </div>
      </div>
    </div>
  )
}