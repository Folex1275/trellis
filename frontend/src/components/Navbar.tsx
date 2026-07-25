import { Link, NavLink } from 'react-router-dom'

const navLinkClass = ({ isActive }: { isActive: boolean }) =>
  `text-sm transition-colors ${isActive ? 'text-cyan-400' : 'text-gray-400 hover:text-gray-200'}`

function Navbar() {
  return (
    <nav className="bg-[#0A0E17] border-b border-navy-700 px-6 py-4 flex items-center justify-between">
      <div className="flex items-center gap-6">
        <Link to="/" className="text-cyan-400 text-xl font-bold tracking-tight">
          Trellis
        </Link>
        <div className="hidden sm:flex items-center gap-5">
          <NavLink to="/create" className={navLinkClass}>
            Create
          </NavLink>
          <NavLink to="/status" className={navLinkClass}>
            Status
          </NavLink>
        </div>
      </div>
      <button className="bg-cyan-400 text-navy-900 font-semibold px-5 py-2 rounded-lg text-sm hover:bg-cyan-300 transition-colors">
        Connect Wallet
      </button>
    </nav>
  )
}

export default Navbar
