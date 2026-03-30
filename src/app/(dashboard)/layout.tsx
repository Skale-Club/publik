import Link from "next/link"

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="min-h-screen flex">
      <aside className="w-64 bg-gray-100 p-4">
        <h2 className="font-bold text-xl mb-6">Publik</h2>
        <nav className="space-y-2">
          <Link href="/dashboard" className="block py-2 px-3 rounded hover:bg-gray-200">
            Dashboard
          </Link>
        </nav>
      </aside>
      <main className="flex-1">
        {children}
      </main>
    </div>
  )
}
