import { render, screen } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import App from './App'
import { CONTRACT_ID } from './lib/config'
import { explorerBaseUrl, STELLAR_EXPERT_ORIGIN } from './lib/explorer'

// jsdom has no canvas implementation; NetworkBackground bails out when
// getContext returns null, which keeps App renderable without the mock leaking
// jsdom "not implemented" noise into the output.
beforeEach(() => {
  vi.spyOn(HTMLCanvasElement.prototype, 'getContext').mockReturnValue(null)
})

describe('<App />', () => {
  it('renders the hero headline and subheading', () => {
    render(<App />)

    expect(
      screen.getByRole('heading', { name: 'Trustless Escrow for Remote Work' }),
    ).toBeInTheDocument()
    expect(
      screen.getByText("Built on Stellar's Soroban smart contract platform"),
    ).toBeInTheDocument()
  })

  it('renders the primary calls to action', () => {
    render(<App />)

    expect(screen.getByRole('button', { name: 'Create Agreement' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Check Status' })).toBeInTheDocument()
  })

  it('renders the navbar', () => {
    render(<App />)

    expect(screen.getByRole('button', { name: 'Connect Wallet' })).toBeInTheDocument()
  })

  it('shows the escrow contract address in full, linked to Stellar Expert', () => {
    render(<App />)

    const contractLink = screen.getByRole('link', { name: new RegExp(CONTRACT_ID) })
    expect(contractLink).toHaveAttribute(
      'href',
      `${STELLAR_EXPERT_ORIGIN}/explorer/testnet/contract/${CONTRACT_ID}`,
    )
  })

  it('links to Stellar Expert from the verification footer', () => {
    render(<App />)

    expect(screen.getByRole('link', { name: 'Stellar Expert' })).toHaveAttribute(
      'href',
      explorerBaseUrl(),
    )
  })

  it('opens every explorer link in a new tab', () => {
    render(<App />)

    const explorerLinks = screen
      .getAllByRole('link')
      .filter((link) => link.getAttribute('href')?.startsWith(STELLAR_EXPERT_ORIGIN))

    expect(explorerLinks.length).toBeGreaterThan(0)
    for (const link of explorerLinks) {
      expect(link).toHaveAttribute('target', '_blank')
      expect(link).toHaveAttribute('rel', 'noopener noreferrer')
    }
  })
})
