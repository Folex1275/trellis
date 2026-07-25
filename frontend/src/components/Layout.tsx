import { Outlet } from 'react-router-dom'
import Navbar from './Navbar'
import { NetworkBackground } from './NetworkBackground'

function Layout() {
  return (
    <div className="relative min-h-screen text-gray-200">
      {/* Animated particle network background */}
      <NetworkBackground />

      {/* All content sits above the canvas */}
      <div className="relative z-10">
        <Navbar />
        <Outlet />
      </div>
    </div>
  )
}

export default Layout
