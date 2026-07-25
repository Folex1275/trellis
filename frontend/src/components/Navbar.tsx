import { useWallet } from '../lib/useWallet';
import { useNavigate as useNavigateRouter } from '../lib/router';

function Navbar() {
  const wallet = useWallet();
  const navigate = useNavigateRouter();

  const handleConnectWallet = async () => {
    try {
      await wallet.connect();
    } catch {
      // Error is handled in useWallet hook
    }
  };

  const handleDisconnectWallet = async () => {
    await wallet.disconnect();
  };

  return (
    <nav className="bg-[#0A0E17] border-b border-navy-700 px-6 py-4 flex items-center justify-between">
      <div className="flex items-center gap-3 cursor-pointer" onClick={() => navigate('/')}>
        <span className="text-cyan-400 text-xl font-bold tracking-tight">Trellis</span>
        <span className="hidden sm:inline text-gray-500 text-sm">Trustless Milestone Escrow</span>
      </div>
      <div className="flex items-center gap-4">
        {wallet.connected && (
          <div className="hidden sm:block text-gray-400 text-sm">
            {wallet.address?.substring(0, 8)}...{wallet.address?.substring(wallet.address.length - 6)}
          </div>
        )}
        <button
          onClick={wallet.connected ? handleDisconnectWallet : handleConnectWallet}
          disabled={wallet.loading}
          className="bg-cyan-400 text-navy-900 font-semibold px-5 py-2 rounded-lg text-sm hover:bg-cyan-300 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {wallet.loading ? 'Loading...' : wallet.connected ? 'Disconnect' : 'Connect Wallet'}
        </button>
      </div>
    </nav>
  );
}

export default Navbar;
