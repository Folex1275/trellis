import {
  isConnected as freighterIsConnected,
  isAllowed as freighterIsAllowed,
  requestAccess as freighterRequestAccess,
  getAddress as freighterGetAddress,
  getNetworkDetails as freighterGetNetworkDetails,
  signTransaction as freighterSignTransaction,
} from '@stellar/freighter-api';

export const DETECTION_BUDGET_MS = 4_000;
const FLAG_POLL_INTERVAL_MS = 100;
const CONNECTION_PROBE_TIMEOUT_MS = 2_400;
const PROBE_RETRY_DELAY_MS = 300;
const ALLOWED_TIMEOUT_MS = 3_000;
const ADDRESS_TIMEOUT_MS = 3_000;
const NETWORK_TIMEOUT_MS = 5_000;
const ACCESS_TIMEOUT_MS = 90_000;
const SIGN_TIMEOUT_MS = 180_000;

export type WalletErrorKind = 'declined' | 'unavailable' | 'timeout' | 'unknown';

export interface WalletError {
  kind: WalletErrorKind;
  message: string;
}

export type WalletResult<T> =
  | { ok: true; value: T }
  | { ok: false; error: WalletError };

const DECLINED_CODE = -4;

const TIMEOUT_ERROR: WalletError = {
  kind: 'timeout',
  message: 'Freighter did not respond. Make sure it is installed and unlocked, then reload.',
};

const UNAVAILABLE_ERROR: WalletError = {
  kind: 'unavailable',
  message: 'Freighter was not detected in this browser.',
};

function toWalletError(raw: unknown): WalletError {
  const err = raw as { code?: number; message?: string } | undefined;
  if (!err) return { kind: 'unknown', message: 'Freighter returned an unexpected error.' };
  if (err.code === DECLINED_CODE) {
    return { kind: 'declined', message: 'You rejected the request in Freighter.' };
  }
  return { kind: 'unknown', message: err.message || 'Freighter returned an unexpected error.' };
}

const TIMED_OUT = Symbol('freighter-timeout');

async function withTimeout<T>(promise: Promise<T>, ms: number): Promise<T | typeof TIMED_OUT> {
  let timer: ReturnType<typeof setTimeout> | undefined;
  const timeout = new Promise<typeof TIMED_OUT>((resolve) => {
    timer = setTimeout(() => resolve(TIMED_OUT), ms);
  });
  try {
    return await Promise.race([promise, timeout]);
  } finally {
    if (timer !== undefined) clearTimeout(timer);
  }
}

function delay(ms: number, signal: AbortSignal): Promise<void> {
  return new Promise<void>((resolve) => {
    const onAbort = () => {
      clearTimeout(timer);
      resolve();
    };
    const timer = setTimeout(() => {
      signal.removeEventListener('abort', onAbort);
      resolve();
    }, ms);
    signal.addEventListener('abort', onAbort, { once: true });
  });
}

function raceForTrue(promises: Promise<boolean>[]): Promise<boolean> {
  return new Promise<boolean>((resolve) => {
    let pending = promises.length;
    let settled = false;
    const fail = () => {
      if (settled) return;
      pending -= 1;
      if (pending === 0) {
        settled = true;
        resolve(false);
      }
    };
    for (const p of promises) {
      p.then((found) => {
        if (settled) return;
        if (found) {
          settled = true;
          resolve(true);
          return;
        }
        fail();
      }, fail);
    }
  });
}

function readInjectedFlag(): boolean {
  if (typeof window === 'undefined') return false;
  const w = window as unknown as { freighter?: unknown };
  return w.freighter === true;
}

function waitForInjectedFlag(budgetMs: number, signal: AbortSignal): Promise<boolean> {
  return new Promise<boolean>((resolve) => {
    if (readInjectedFlag()) return resolve(true);
    if (signal.aborted) return resolve(false);

    const deadline = Date.now() + budgetMs;
    let intervalId: ReturnType<typeof setInterval> | undefined;

    const finish = (found: boolean) => {
      if (intervalId !== undefined) clearInterval(intervalId);
      signal.removeEventListener('abort', onAbort);
      resolve(found);
    };
    const onAbort = () => finish(false);

    signal.addEventListener('abort', onAbort, { once: true });
    intervalId = setInterval(() => {
      if (readInjectedFlag()) finish(true);
      else if (Date.now() >= deadline) finish(false);
    }, FLAG_POLL_INTERVAL_MS);
  });
}

async function probeIsConnected(): Promise<boolean> {
  const res = await withTimeout(freighterIsConnected(), CONNECTION_PROBE_TIMEOUT_MS);
  if (res === TIMED_OUT) return false;
  return res.isConnected === true;
}

export async function isFreighterInstalled(signal?: AbortSignal): Promise<boolean> {
  if (readInjectedFlag()) return true;

  const controller = new AbortController();
  if (signal) {
    if (signal.aborted) controller.abort();
    else signal.addEventListener('abort', () => controller.abort(), { once: true });
  }
  const inner = controller.signal;

  const flagWatch = waitForInjectedFlag(DETECTION_BUDGET_MS, inner);
  const handshake = (async () => {
    if (await probeIsConnected()) return true;
    if (inner.aborted) return false;
    await delay(PROBE_RETRY_DELAY_MS, inner);
    if (inner.aborted) return false;
    return probeIsConnected();
  })();

  const result = await withTimeout(raceForTrue([flagWatch, handshake]), DETECTION_BUDGET_MS);
  controller.abort();
  if (result === TIMED_OUT) return readInjectedFlag();
  return result;
}

export async function isAppAllowed(): Promise<boolean> {
  const res = await withTimeout(freighterIsAllowed(), ALLOWED_TIMEOUT_MS);
  if (res === TIMED_OUT) return false;
  if (res.error) return false;
  return res.isAllowed === true;
}

export async function getPublicKey(): Promise<string | null> {
  const res = await withTimeout(freighterGetAddress(), ADDRESS_TIMEOUT_MS);
  if (res === TIMED_OUT) return null;
  if (res.error) return null;
  return res.address ? res.address : null;
}

export async function getNetworkPassphrase(): Promise<string | null> {
  const res = await withTimeout(freighterGetNetworkDetails(), NETWORK_TIMEOUT_MS);
  if (res === TIMED_OUT) return null;
  if (res.error) return null;
  return res.networkPassphrase ? res.networkPassphrase : null;
}

export async function connectWallet(): Promise<WalletResult<string>> {
  const res = await withTimeout(freighterRequestAccess(), ACCESS_TIMEOUT_MS);
  if (res === TIMED_OUT) return { ok: false, error: TIMEOUT_ERROR };
  if (res.error) return { ok: false, error: toWalletError(res.error) };
  if (!res.address) return { ok: false, error: UNAVAILABLE_ERROR };
  return { ok: true, value: res.address };
}

export async function signTransaction(
  xdr: string,
  opts?: { networkPassphrase?: string; address?: string },
): Promise<WalletResult<string>> {
  const res = await withTimeout(freighterSignTransaction(xdr, opts), SIGN_TIMEOUT_MS);
  if (res === TIMED_OUT) return { ok: false, error: TIMEOUT_ERROR };
  if (res.error) return { ok: false, error: toWalletError(res.error) };
  return { ok: true, value: res.signedTxXdr };
}
