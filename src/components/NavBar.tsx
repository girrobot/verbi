import Link from 'next/link'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faHome, faCog, faPlus, faSignOutAlt } from '@fortawesome/free-solid-svg-icons'

export default function NavBar() {
  const handleSignOut = () => {
    // Add sign-out logic here
  }

  return (
    <nav className="bg-white shadow p-4">
      <div className="max-w-7xl mx-auto flex justify-between items-center">
        <div className="flex space-x-4">
          <Link href="/dashboard" className="btn btn-link flex items-center">
            <FontAwesomeIcon icon={faHome} className="mr-1" />
            Dashboard
          </Link>
          <Link href="/settings" className="btn btn-link flex items-center">
            <FontAwesomeIcon icon={faCog} className="mr-1" />
            Settings
          </Link>
        </div>
        <div className="flex space-x-4 items-center">
          <Link href="/editor/new">
            <button className="btn btn-primary flex items-center">
              <FontAwesomeIcon icon={faPlus} className="mr-1" />
              Create New Document
            </button>
          </Link>
          <button onClick={handleSignOut} className="btn btn-secondary flex items-center">
            <FontAwesomeIcon icon={faSignOutAlt} className="mr-1" />
            Sign Out
          </button>
        </div>
      </div>
    </nav>
  )
}