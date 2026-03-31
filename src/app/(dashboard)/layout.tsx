import Link from "next/link"

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="min-h-screen flex">
      <aside className="w-64 bg-gray-100 dark:bg-gray-900 border-r border-gray-200 dark:border-gray-700 p-4">
        <h2 className="font-bold text-xl mb-6 text-gray-900 dark:text-gray-100">Publik</h2>
        <nav className="space-y-2">
          <Link href="/dashboard" className="block py-2 px-3 rounded text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-800">
            Dashboard
          </Link>
        </nav>
      </aside>
      <main className="flex-1 bg-white dark:bg-gray-950">
        {children}
      </main>
    </div>
  )
}
