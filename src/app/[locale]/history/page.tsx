import UnifiedHistory from '@/components/history/UnifiedHistory'

export default async function HistoryPage({
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  params
}: {
  params: Promise<{locale: string}>
}) {

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <UnifiedHistory />
    </div>
  )
}