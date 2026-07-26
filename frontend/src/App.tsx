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
    <div className="relative min-h-screen text-gray-200">
      {/* Animated particle network background */}
      <NetworkBackground />

      {/* All content sits above the canvas */}
      <div className="relative z-10">
        <Navbar />
        <main className="flex flex-col items-center justify-center px-6 pt-24 pb-32 text-center">
          <h1 className="text-4xl sm:text-5xl font-bold tracking-tight text-white max-w-2xl leading-tight">
            Trustless Escrow for Remote Work
          </h1>
          <p className="mt-4 text-gray-400 text-lg sm:text-xl max-w-xl">
            Built on Stellar's Soroban smart contract platform
          </p>
          <div className="mt-10 flex flex-col sm:flex-row gap-4">
            <button className="bg-cyan-400 text-navy-900 font-semibold px-8 py-3 rounded-lg text-base hover:bg-cyan-300 transition-colors">
              Create Agreement
            </button>
            <button className="border border-cyan-400 text-cyan-400 font-semibold px-8 py-3 rounded-lg text-base hover:bg-cyan-400/10 transition-colors">
              Check Status
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
