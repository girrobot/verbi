import Link from 'next/link'

export default function NavBar() {
  return (
    <nav className="bg-white shadow p-4">
      <div className="max-w-7xl mx-auto flex justify-between items-center">
        <div className="flex space-x-4">
          <Link href="/dashboard" className="text-blue-600 hover:underline">
            Dashboard
          </Link>
          <Link href="/settings" className="text-blue-600 hover:underline">
            Settings
          </Link>
        </div>
        <Link href="/editor/new">
          <button className="px-4 py-2 text-sm text-white bg-blue-600 hover:bg-blue-700 rounded-lg">
            Create New Document
          </button>
        </Link>
      </div>
    </nav>
  )
}