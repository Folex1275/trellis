import { useWallet } from '../context/WalletContext';

export function useWalletLegacy() {
  const { connected, publicKey, wrongNetwork, connecting, connect, disconnect, error } = useWallet();
  return {
    connected,
    publicKey,
    address: publicKey,
    wrongNetwork,
    loading: connecting,
    error,
    connect: async () => { await connect(); },
    disconnect: async () => { disconnect(); },
  };
}

export { useWalletLegacy as useWallet };
