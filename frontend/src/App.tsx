import { useEffect, useState } from 'react'
import Navbar from './components/Navbar'
import { NetworkBackground } from './components/NetworkBackground'
import { AgreementIdGenerator } from './components/AgreementIdGenerator'

function App() {
  const [showGenerator, setShowGenerator] = useState(false)

  useEffect(() => {
    const theme = localStorage.getItem('theme') || 'dark'
    if (theme === 'light') {
      document.documentElement.classList.add('light')
    } else {
      document.documentElement.classList.remove('light')
      document.documentElement.classList.add('dark')
    }
  }, [])

  return (
    <div className="relative min-h-screen text-gray-200 dark:text-gray-200 light:text-gray-900 bg-navy-900 dark:bg-navy-900 light:bg-white">
      {/* Animated particle network background */}
      <NetworkBackground />

      {/* All content sits above the canvas */}
      <div className="relative z-10">
        <Navbar />
        {showGenerator ? (
          <main className="flex flex-col items-center justify-center px-4 sm:px-6 pt-16 sm:pt-24 pb-16 sm:pb-32">
            <button
              onClick={() => setShowGenerator(false)}
              className="mb-6 text-gray-400 hover:text-gray-300 dark:hover:text-gray-300 light:hover:text-gray-600 flex items-center gap-2"
            >
              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M9.707 16.707a1 1 0 01-1.414 0l-6-6a1 1 0 010-1.414l6-6a1 1 0 011.414 1.414L5.414 9H17a1 1 0 110 2H5.414l4.293 4.293a1 1 0 010 1.414z" clipRule="evenodd" />
              </svg>
              Back
            </button>
            <AgreementIdGenerator />
          </main>
        ) : (
          <main className="flex flex-col items-center justify-center px-4 sm:px-6 pt-16 sm:pt-24 pb-16 sm:pb-32 text-center">
            <h1 className="text-3xl sm:text-4xl md:text-5xl font-bold tracking-tight text-white dark:text-white light:text-gray-900 max-w-2xl leading-tight">
              Trustless Escrow for Remote Work
            </h1>
            <p className="mt-4 text-gray-400 dark:text-gray-400 light:text-gray-600 text-base sm:text-lg md:text-xl max-w-xl px-2">
              Built on Stellar's Soroban smart contract platform
            </p>
            <div className="mt-8 sm:mt-10 flex flex-col sm:flex-row gap-3 sm:gap-4 w-full sm:w-auto px-2">
              <button
                onClick={() => setShowGenerator(true)}
                className="bg-cyan-400 text-navy-900 font-semibold px-6 sm:px-8 py-2.5 sm:py-3 rounded-lg text-sm sm:text-base hover:bg-cyan-300 transition-colors"
              >
                Create Agreement
              </button>
              <button className="border border-cyan-400 text-cyan-400 dark:text-cyan-400 light:text-cyan-500 font-semibold px-6 sm:px-8 py-2.5 sm:py-3 rounded-lg text-sm sm:text-base hover:bg-cyan-400/10 transition-colors">
                Check Status
              </button>
            </div>
          </main>
        )}
      </div>
    </div>
  )
}

export default App
