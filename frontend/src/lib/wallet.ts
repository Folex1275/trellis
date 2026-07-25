import { NETWORK_PASSPHRASE } from './config';

export interface WalletState {
  connected: boolean;
  publicKey: string | null;
  address: string | null;
}

const INITIAL_STATE: WalletState = {
  connected: false,
  publicKey: null,
  address: null,
};

let walletState = { ...INITIAL_STATE };
let walletListeners: Array<(state: WalletState) => void> = [];

export function subscribeToWallet(callback: (state: WalletState) => void) {
  walletListeners.push(callback);
  callback(walletState);

  return () => {
    walletListeners = walletListeners.filter((c) => c !== callback);
  };
}

function emitWalletChange() {
  walletListeners.forEach((cb) => cb(walletState));
}

export async function connectWallet(): Promise<WalletState> {
  if (!window.freighter) {
    throw new Error('Freighter wallet extension not installed');
  }

  try {
    const publicKey = await window.freighter.getPublicKey();

    // Convert stellar public key to contract address format
    const address = `G${publicKey.substring(1)}`;

    walletState = {
      connected: true,
      publicKey,
      address,
    };

    emitWalletChange();
    return walletState;
  } catch (error) {
    console.error('Failed to connect wallet:', error);
    throw error;
  }
}

export async function disconnectWallet(): Promise<void> {
  walletState = { ...INITIAL_STATE };
  emitWalletChange();
}

export function getWalletState(): WalletState {
  return { ...walletState };
}

export async function signTransaction(xdr: string): Promise<string> {
  if (!window.freighter || !walletState.connected) {
    throw new Error('Wallet not connected');
  }

  try {
    const signedXdr = await window.freighter.signTransaction(xdr, {
      networkPassphrase: NETWORK_PASSPHRASE,
    });
    return signedXdr;
  } catch (error) {
    console.error('Failed to sign transaction:', error);
    throw error;
  }
}

// Extend Window interface for Freighter
declare global {
  interface Window {
    freighter?: {
      getPublicKey(): Promise<string>;
      signTransaction(
        xdr: string,
        options: { networkPassphrase: string }
      ): Promise<string>;
      isConnected(): Promise<boolean>;
    };
  }
}
