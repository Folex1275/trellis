import { useNavigate as useNavigateRouter } from '../lib/router';
import { StatsBar } from '../components/StatsBar';

export default function HomePage() {
  const navigate = useNavigateRouter();

  return (
    <div className="relative min-h-screen text-gray-200">
      <div className="relative z-10">
        <main className="flex flex-col items-center justify-center px-6 pt-24 pb-32 text-center">
          <h1 className="text-4xl sm:text-5xl font-bold tracking-tight text-white max-w-2xl leading-tight">
            Trustless Escrow for Remote Work
          </h1>
          <p className="mt-4 text-gray-400 text-lg sm:text-xl max-w-xl">
            Built on Stellar's Soroban smart contract platform
          </p>

          {/* Live on-chain stats — no fabricated metrics */}
          <StatsBar />

          <div className="mt-10 flex flex-col sm:flex-row gap-4">
            <button
              onClick={() => navigate('/create')}
              className="bg-cyan-400 text-navy-900 font-semibold px-8 py-3 rounded-lg text-base hover:bg-cyan-300 transition-colors"
            >
              Create Agreement
            </button>
            <button
              onClick={() => navigate('/status')}
              className="border border-cyan-400 text-cyan-400 font-semibold px-8 py-3 rounded-lg text-base hover:bg-cyan-400/10 transition-colors"
            >
              Check Status
            </button>
          </div>

          {/* Features Section */}
          <div className="mt-20 max-w-4xl grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="bg-navy-800/50 border border-navy-700 rounded-lg p-6">
              <h3 className="text-cyan-400 font-bold text-lg mb-2">Read Any Agreement</h3>
              <p className="text-gray-400 text-sm">
                Paste an Agreement ID to view its current on-chain state — no wallet connection needed.
              </p>
            </div>
            <div className="bg-navy-800/50 border border-navy-700 rounded-lg p-6">
              <h3 className="text-cyan-400 font-bold text-lg mb-2">Create & Fund Milestones</h3>
              <p className="text-gray-400 text-sm">
                Create escrow agreements with multiple milestones and fund them directly from the browser.
              </p>
            </div>
            <div className="bg-navy-800/50 border border-navy-700 rounded-lg p-6">
              <h3 className="text-cyan-400 font-bold text-lg mb-2">Complete Audit Trail</h3>
              <p className="text-gray-400 text-sm">
                Every action emits an on-chain event — full history and transparency for all parties.
              </p>
            </div>
          </div>

          {/* How It Works */}
          <div className="mt-20 max-w-2xl">
            <h2 className="text-2xl font-bold text-white mb-8">How It Works</h2>
            <div className="space-y-6 text-left">
              <div className="flex gap-4">
                <div className="flex-shrink-0 w-8 h-8 bg-cyan-400 rounded-full flex items-center justify-center text-navy-900 font-bold">
                  1
                </div>
                <div>
                  <h3 className="text-white font-bold mb-1">Create Agreement</h3>
                  <p className="text-gray-400 text-sm">
                    Define milestones, amounts, and the people involved. The payer authorizes and pays fees.
                  </p>
                </div>
              </div>
              <div className="flex gap-4">
                <div className="flex-shrink-0 w-8 h-8 bg-cyan-400 rounded-full flex items-center justify-center text-navy-900 font-bold">
                  2
                </div>
                <div>
                  <h3 className="text-white font-bold mb-1">Lock Funds</h3>
                  <p className="text-gray-400 text-sm">
                    The payer deposits the agreed amount for each milestone into the contract.
                  </p>
                </div>
              </div>
              <div className="flex gap-4">
                <div className="flex-shrink-0 w-8 h-8 bg-cyan-400 rounded-full flex items-center justify-center text-navy-900 font-bold">
                  3
                </div>
                <div>
                  <h3 className="text-white font-bold mb-1">Submit Work</h3>
                  <p className="text-gray-400 text-sm">
                    The payee completes the work and submits proof (GitHub link, file, etc.).
                  </p>
                </div>
              </div>
              <div className="flex gap-4">
                <div className="flex-shrink-0 w-8 h-8 bg-cyan-400 rounded-full flex items-center justify-center text-navy-900 font-bold">
                  4
                </div>
                <div>
                  <h3 className="text-white font-bold mb-1">Approve & Release</h3>
                  <p className="text-gray-400 text-sm">
                    The payer reviews and approves. Funds are released to the payee on-chain.
                  </p>
                </div>
              </div>
              <div className="flex gap-4">
                <div className="flex-shrink-0 w-8 h-8 bg-cyan-400 rounded-full flex items-center justify-center text-navy-900 font-bold">
                  ⚖️
                </div>
                <div>
                  <h3 className="text-white font-bold mb-1">Dispute (if needed)</h3>
                  <p className="text-gray-400 text-sm">
                    Either party can raise a dispute. A trusted resolver arbitrates and releases funds fairly.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
