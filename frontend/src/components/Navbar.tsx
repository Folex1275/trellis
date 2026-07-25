import { useState } from 'react'

function Navbar() {
  const [isDark, setIsDark] = useState(() => {
    if (typeof window === 'undefined') return true
    return localStorage.getItem('theme') !== 'light'
  })

  const toggleTheme = () => {
    const newIsDark = !isDark
    setIsDark(newIsDark)
    localStorage.setItem('theme', newIsDark ? 'dark' : 'light')
    if (newIsDark) {
      document.documentElement.classList.remove('light')
      document.documentElement.classList.add('dark')
    } else {
      document.documentElement.classList.remove('dark')
      document.documentElement.classList.add('light')
    }
  }

  return (
    <nav className="bg-[#0A0E17] dark:bg-[#0A0E17] light:bg-white border-b border-navy-700 dark:border-navy-700 light:border-gray-200 px-4 sm:px-6 py-3 sm:py-4 flex items-center justify-between">
      <div className="flex items-center gap-2 sm:gap-3 min-w-0">
        <span className="text-cyan-400 text-lg sm:text-xl font-bold tracking-tight">Trellis</span>
        <span className="hidden sm:inline text-gray-500 dark:text-gray-500 light:text-gray-600 text-xs sm:text-sm whitespace-nowrap">Trustless Milestone Escrow</span>
      </div>
      <div className="flex items-center gap-2 sm:gap-3">
        <button
          onClick={toggleTheme}
          className="p-2 hover:bg-gray-800 dark:hover:bg-gray-800 light:hover:bg-gray-100 rounded-lg transition-colors"
          aria-label="Toggle theme"
        >
          {isDark ? (
            <svg className="w-5 h-5 text-yellow-400" fill="currentColor" viewBox="0 0 20 20">
              <path d="M17.293 13.293A8 8 0 016.707 2.707a8.001 8.001 0 1010.586 10.586z" />
            </svg>
          ) : (
            <svg className="w-5 h-5 text-yellow-400" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M10 2a1 1 0 011 1v2a1 1 0 11-2 0V3a1 1 0 011-1zm4 8a4 4 0 11-8 0 4 4 0 018 0zm-.464 4.95l-2.12-2.12a4 4 0 00 5.656 5.656l2.12-2.12a6 6 0 10-5.656-5.656zM9 16.9a1 1 0 011.414 1.414l-2 2a1 1 0 01-1.414-1.414l2-2zM21 12a1 1 0 110-2h2a1 1 0 110 2h-2zM9 2.1a1 1 0 01.9 1.414l-2 2a1 1 0 01-1.414-1.414l2-2A1 1 0 019 2.1z" clipRule="evenodd" />
            </svg>
          )}
        </button>
        <button className="bg-cyan-400 text-navy-900 font-semibold px-4 sm:px-5 py-2 rounded-lg text-xs sm:text-sm hover:bg-cyan-300 transition-colors whitespace-nowrap">
          Connect Wallet
        </button>
      </div>
    </nav>
  )
}

export default Navbar
