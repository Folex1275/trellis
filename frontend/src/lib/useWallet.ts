import { useEffect, useState } from 'react';
import type { WalletState } from './wallet';
import { subscribeToWallet, connectWallet, disconnectWallet } from './wallet';

export function useWallet() {
  const [walletState, setWalletState] = useState<WalletState>({
    connected: false,
    publicKey: null,
    address: null,
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const unsubscribe = subscribeToWallet(setWalletState);
    return unsubscribe;
  }, []);

  const connect = async () => {
    setLoading(true);
    setError(null);
    try {
      await connectWallet();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to connect wallet');
    } finally {
      setLoading(false);
    }
  };

  const disconnect = async () => {
    setLoading(true);
    try {
      await disconnectWallet();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to disconnect wallet');
    } finally {
      setLoading(false);
    }
  };

  return {
    ...walletState,
    loading,
    error,
    connect,
    disconnect,
  };
}
