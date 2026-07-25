import { CONTRACT_ID } from '../lib/config'
import { ACTIVE_NETWORK, explorerBaseUrl, networkLabel } from '../lib/explorer'
import { ExplorerLink } from './ExplorerLink'

function Navbar() {
  return (
    <nav className="bg-[#0A0E17] border-b border-navy-700 px-6 py-4 flex items-center justify-between">
      <div className="flex items-center gap-3">
        <span className="text-cyan-400 text-xl font-bold tracking-tight">Trellis</span>
        <span className="hidden sm:inline text-gray-500 text-sm">Trustless Milestone Escrow</span>
      </div>
      <div className="flex items-center gap-4">
        {/* Network badge doubles as a link to the explorer for this network. */}
        <a
          href={explorerBaseUrl()}
          target="_blank"
          rel="noopener noreferrer"
          title={`Browse the Stellar ${networkLabel()} on Stellar Expert`}
          className="hidden sm:inline-flex items-center gap-1.5 rounded-full border border-cyan-400/30 px-3 py-1 text-xs font-medium text-cyan-400 transition-colors hover:border-cyan-400/60 hover:bg-cyan-400/10"
        >
          <span className="h-1.5 w-1.5 rounded-full bg-cyan-400" aria-hidden="true" />
          {networkLabel(ACTIVE_NETWORK)}
        </a>
        {/* The deployed escrow contract — verifiable before connecting a wallet. */}
        <ExplorerLink
          type="contract"
          value={CONTRACT_ID}
          className="hidden md:inline-flex text-xs"
        />
        <button className="bg-cyan-400 text-navy-900 font-semibold px-5 py-2 rounded-lg text-sm hover:bg-cyan-300 transition-colors">
          Connect Wallet
        </button>
      </div>
    </nav>
  )
}

export default Navbar
