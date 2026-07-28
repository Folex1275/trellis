import { useNavigate } from '../lib/router'
import { CONTRACT_ID } from '../lib/config'
import { ACTIVE_NETWORK, explorerBaseUrl, networkLabel } from '../lib/explorer'
import { ExplorerLink } from './ExplorerLink'
import WalletConnect from './WalletConnect'

function Navbar() {
  const navigate = useNavigate();

  return (
    <nav className="bg-navy-900 border-b border-navy-700 px-6 py-4 flex items-center justify-between">
      <div className="flex items-center gap-3 cursor-pointer" onClick={() => navigate('/')}>
        <span className="text-cyan-400 text-xl font-bold tracking-tight">Trellis</span>
        <span className="hidden sm:inline text-gray-500 text-sm">Trustless Milestone Escrow</span>
      </div>
      <div className="flex items-center gap-4">
        {/* Network badge doubles as a link to the explorer for this network.
            On mobile the text label is visually hidden but still readable by
            screen readers via sr-only, satisfying WCAG 2.1 SC 1.4.1. */}
        <a
          href={explorerBaseUrl()}
          target="_blank"
          rel="noopener noreferrer"
          title={`Browse the Stellar ${networkLabel()} on Stellar Expert`}
          aria-label={`Network status: ${networkLabel(ACTIVE_NETWORK)} — view on Stellar Expert`}
          role="status"
          aria-live="polite"
          className="inline-flex items-center gap-1.5 rounded-full border border-cyan-400/30 px-3 py-1 text-xs font-medium text-cyan-400 transition-colors hover:border-cyan-400/60 hover:bg-cyan-400/10"
        >
          <span
            className="h-1.5 w-1.5 rounded-full bg-cyan-400"
            aria-hidden="true"
            title={`Connected to ${networkLabel(ACTIVE_NETWORK)}`}
          />
          <span className="sr-only sm:hidden">{networkLabel(ACTIVE_NETWORK)}</span>
          <span className="hidden sm:inline">{networkLabel(ACTIVE_NETWORK)}</span>
        </a>
        {/* The deployed escrow contract — verifiable before connecting a wallet. */}
        <ExplorerLink
          type="contract"
          value={CONTRACT_ID}
          className="hidden md:inline-flex text-xs"
        />
        <WalletConnect />
      </div>
    </nav>
  );
}

export default Navbar;
