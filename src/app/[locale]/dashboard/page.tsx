import Dashboard from '@/components/dashboard/Dashboard'

export default async function DashboardPage({
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  params
}: {
  params: Promise<{locale: string}>
}) {

  return (
    <div className="min-h-screen bg-gray-50">
      <Dashboard />
    </div>
  )
}