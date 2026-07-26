export const HISTORY_STORAGE_KEY = 'trellis_agreement_history'

/** Most recent entries kept; older ones fall off the end of the list. */
export const MAX_HISTORY_ENTRIES = 20

export type AgreementRole = 'payer' | 'payee' | 'resolver' | 'observer'

export interface HistoryEntry {
  agreementId: string
  /** User-defined nickname. */
  label?: string
  /** ISO timestamp of the last view. */
  lastViewed: string
  role?: AgreementRole
}

function isHistoryEntry(value: unknown): value is HistoryEntry {
  if (typeof value !== 'object' || value === null) return false
  const entry = value as Partial<HistoryEntry>
  return typeof entry.agreementId === 'string' && typeof entry.lastViewed === 'string'
}

function readStorage(): HistoryEntry[] {
  try {
    const raw = localStorage.getItem(HISTORY_STORAGE_KEY)
    if (!raw) return []
    const parsed: unknown = JSON.parse(raw)
    if (!Array.isArray(parsed)) return []
    return parsed.filter(isHistoryEntry)
  } catch {
    // Corrupt JSON or storage unavailable (private mode, disabled cookies).
    return []
  }
}

function writeStorage(entries: HistoryEntry[]): void {
  try {
    localStorage.setItem(HISTORY_STORAGE_KEY, JSON.stringify(entries))
  } catch {
    // Storage full or unavailable — history is a convenience, so fail quietly.
  }
}

/** Stored agreements, newest first. */
export function getHistory(): HistoryEntry[] {
  return readStorage()
}

/**
 * Add an entry to the front of the list. An existing entry with the same
 * agreementId is replaced (its label and role are preserved unless the new
 * entry supplies them), and the list is capped at MAX_HISTORY_ENTRIES.
 */
export function addToHistory(entry: HistoryEntry): void {
  const existing = readStorage()
  const previous = existing.find((item) => item.agreementId === entry.agreementId)
  const merged: HistoryEntry = {
    ...previous,
    ...entry,
    label: entry.label ?? previous?.label,
    role: entry.role ?? previous?.role,
  }
  const rest = existing.filter((item) => item.agreementId !== entry.agreementId)
  writeStorage([merged, ...rest].slice(0, MAX_HISTORY_ENTRIES))
}

export function removeFromHistory(agreementId: string): void {
  writeStorage(readStorage().filter((item) => item.agreementId !== agreementId))
}

export function clearHistory(): void {
  try {
    localStorage.removeItem(HISTORY_STORAGE_KEY)
  } catch {
    // Nothing to do — see writeStorage.
  }
}
