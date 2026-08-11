import Sidebar from '@/components/layout/Sidebar'
import SyncStatusBar from '@/components/offline/SyncStatusBar'

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="flex min-h-screen bg-gray-50">
      <Sidebar />
      <main className="flex-1 overflow-auto">
        <SyncStatusBar />
        {children}
      </main>
    </div>
  )
}
