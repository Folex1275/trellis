function validateEnv(name: string, value: unknown): string {
  if (typeof value !== 'string' || !value) {
    throw new Error(`Environment variable ${name} is not set. Copy .env.example to .env and fill in values.`);
  }
  return value;
}

export const CONTRACT_ID = validateEnv('VITE_CONTRACT_ID', import.meta.env.VITE_CONTRACT_ID);
export const RPC_URL = validateEnv('VITE_RPC_URL', import.meta.env.VITE_RPC_URL);
export const NETWORK_PASSPHRASE = validateEnv('VITE_NETWORK_PASSPHRASE', import.meta.env.VITE_NETWORK_PASSPHRASE);
