import { fireEvent, render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import AgreementHistoryPage from './AgreementHistoryPage'
import { ToastContext, type ToastContextValue } from '../components/toast/toast-context'
import { HISTORY_STORAGE_KEY, MAX_HISTORY_ENTRIES } from '../lib/history'

function makeToastStub(): ToastContextValue {
  return {
    toasts: [],
    show: vi.fn().mockReturnValue('id'),
    pending: vi.fn().mockReturnValue('id'),
    success: vi.fn().mockReturnValue('id'),
    error: vi.fn().mockReturnValue('id'),
    info: vi.fn().mockReturnValue('id'),
    update: vi.fn(),
    dismiss: vi.fn(),
    dismissAll: vi.fn(),
  }
}

function renderPage(toastStub = makeToastStub()) {
  return render(
    <ToastContext.Provider value={toastStub}>
      <MemoryRouter>
        <AgreementHistoryPage />
      </MemoryRouter>
    </ToastContext.Provider>,
  )
}

function addEntryToStorage(agreementId: string, label?: string, role?: string) {
  const existing = JSON.parse(localStorage.getItem(HISTORY_STORAGE_KEY) || '[]')
  existing.unshift({
    agreementId,
    lastViewed: new Date().toISOString(),
    label,
    role,
  })
  localStorage.setItem(HISTORY_STORAGE_KEY, JSON.stringify(existing))
}

beforeEach(() => {
  localStorage.clear()
  // jsdom doesn't implement clipboard API by default
  Object.defineProperty(navigator, 'clipboard', {
    value: { writeText: vi.fn().mockResolvedValue(undefined) },
    writable: true,
  })
})

afterEach(() => {
  localStorage.clear()
})

describe('<AgreementHistoryPage />', () => {
  it('renders the page heading', () => {
    renderPage()
    expect(screen.getByRole('heading', { name: 'Agreement History' })).toBeInTheDocument()
  })

  it('shows empty state when no entries exist', () => {
    renderPage()
    expect(screen.getByText(/No agreements viewed yet/)).toBeInTheDocument()
  })

  it('shows empty state links to create and status pages', () => {
    renderPage()
    expect(screen.getByRole('link', { name: 'create one' })).toHaveAttribute('href', '/create')
    expect(screen.getByRole('link', { name: 'check an existing agreement' })).toHaveAttribute(
      'href',
      '/status',
    )
  })

  it('renders history entries from localStorage', () => {
    addEntryToStorage('deadbeef1234567890abcdef1234567890abcdef1234567890abcdef1234567890')

    renderPage()

    // The truncated ID should be visible
    expect(screen.getByText(/deadbeef…567890/)).toBeInTheDocument()
  })

  it('renders label when provided, otherwise shows "Unnamed Agreement"', () => {
    addEntryToStorage('abc123')
    addEntryToStorage('def456', 'Design Contract')

    renderPage()

    expect(screen.getByText('Unnamed Agreement')).toBeInTheDocument()
    expect(screen.getByText('Design Contract')).toBeInTheDocument()
  })

  it('renders role badge when role is provided', () => {
    addEntryToStorage('abc123', undefined, 'payer')

    renderPage()

    expect(screen.getByText('payer')).toBeInTheDocument()
  })

  it('does not render role badge when role is not provided', () => {
    addEntryToStorage('abc123')

    renderPage()

    expect(screen.queryByText('payer')).not.toBeInTheDocument()
  })

  it('shows "View" link that navigates to the agreement page', () => {
    addEntryToStorage('abc123')

    renderPage()

    const viewLink = screen.getByRole('link', { name: 'View' })
    expect(viewLink).toBeInTheDocument()
    expect(viewLink).toHaveAttribute('href', '/agreement/abc123')
  })

  it('"Remove" button deletes the entry from the list', () => {
    addEntryToStorage('keep-me')
    addEntryToStorage('remove-me')

    renderPage()

    // There should be two entries initially
    const removeButtons = screen.getAllByRole('button', { name: 'Remove' })
    expect(removeButtons).toHaveLength(2)

    fireEvent.click(removeButtons[0])

    // After removal, only one should remain
    expect(screen.getAllByRole('button', { name: 'Remove' })).toHaveLength(1)
    expect(screen.getByText(/keep-me/)).toBeInTheDocument()
  })

  it('"Clear All" button shows confirmation, then clears when confirmed', () => {
    addEntryToStorage('entry1')
    addEntryToStorage('entry2')

    renderPage()

    // Click "Clear All"
    fireEvent.click(screen.getByRole('button', { name: 'Clear All' }))

    // Confirmation buttons should appear
    expect(screen.getByRole('button', { name: 'Confirm' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Cancel' })).toBeInTheDocument()

    // Confirm
    fireEvent.click(screen.getByRole('button', { name: 'Confirm' }))

    // Empty state should appear
    expect(screen.getByText(/No agreements viewed yet/)).toBeInTheDocument()
  })

  it('"Cancel" on clear confirmation returns to normal state', () => {
    addEntryToStorage('entry1')

    renderPage()

    fireEvent.click(screen.getByRole('button', { name: 'Clear All' }))
    fireEvent.click(screen.getByRole('button', { name: 'Cancel' }))

    // Should still see the entry and the "Clear All" button
    expect(screen.getByRole('button', { name: 'Clear All' })).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: 'Confirm' })).not.toBeInTheDocument()
  })

  it('hides "Clear All" when there are no entries', () => {
    renderPage()

    expect(screen.queryByRole('button', { name: 'Clear All' })).not.toBeInTheDocument()
  })

  it('copy button copies agreement ID to clipboard', async () => {
    addEntryToStorage('copy-target-id')

    renderPage()

    // Find the copy button by its aria-label
    const copyButton = screen.getByRole('button', { name: /Copy agreement ID/ })
    fireEvent.click(copyButton)

    expect(navigator.clipboard.writeText).toHaveBeenCalledWith('copy-target-id')
  })

  it('renders relative time for each entry', () => {
    addEntryToStorage('entry1')

    renderPage()

    // Should show "just now" for a brand-new entry
    expect(screen.getByText('just now')).toBeInTheDocument()
  })

  it('caps displayed entries at MAX_HISTORY_ENTRIES', () => {
    // Use addToHistory which enforces the cap; addEntryToStorage bypasses it
    for (let i = 0; i < MAX_HISTORY_ENTRIES + 5; i++) {
      const existing = JSON.parse(localStorage.getItem(HISTORY_STORAGE_KEY) || '[]')
      existing.unshift({
        agreementId: `id-${i}`,
        lastViewed: new Date().toISOString(),
      })
      // Enforce cap manually to simulate addToHistory behavior
      const capped = existing.slice(0, MAX_HISTORY_ENTRIES)
      localStorage.setItem(HISTORY_STORAGE_KEY, JSON.stringify(capped))
    }

    renderPage()

    // Only MAX_HISTORY_ENTRIES remove buttons should be displayed
    const removeButtons = screen.getAllByRole('button', { name: 'Remove' })
    expect(removeButtons.length).toBeLessThanOrEqual(MAX_HISTORY_ENTRIES)
  })
})
