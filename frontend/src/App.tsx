import { useEffect, useState } from 'react'
import Navbar from './components/Navbar'
import { ExplorerLink } from './components/ExplorerLink'
import { NetworkBackground } from './components/NetworkBackground'
import { CONTRACT_ID } from './lib/config'
import { explorerBaseUrl, networkLabel } from './lib/explorer'

function App() {
  const route = useRoute();

  useEffect(() => {
    initializeRouter();
  }, []);

  const renderPage = () => {
    switch (route.page) {
      case 'status':
        return <StatusPage />;
      case 'create':
        return <CreatePage />;
      case 'home':
      default:
        return <HomePage />;
    }
  };

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
          </div>

          {/* Escrow terms are only as trustworthy as they are verifiable —
              surface the contract address itself, not just a claim about it. */}
          <p className="mt-12 flex flex-wrap items-center justify-center gap-2 text-sm text-gray-500">
            <span>Escrow contract on {networkLabel()}:</span>
            <ExplorerLink type="contract" value={CONTRACT_ID} full />
          </p>
        </main>

        <footer className="border-t border-navy-700/60 px-6 py-8 text-center text-sm text-gray-500">
          <p>
            Every agreement, deposit, and dispute resolution is recorded on-chain. Verify any of
            them yourself on{' '}
            <a
              href={explorerBaseUrl()}
              target="_blank"
              rel="noopener noreferrer"
              className="text-cyan-400 underline decoration-cyan-400/40 underline-offset-2 transition-colors hover:text-cyan-300"
            >
              Stellar Expert
            </a>
            .
          </p>
        </footer>
      </div>
    </div>
  );
}

export default App;
