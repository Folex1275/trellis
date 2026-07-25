import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'

import Navbar from './Navbar'
import { explorerBaseUrl } from '../lib/explorer'

describe('<Navbar />', () => {
  it('renders the product name and tagline', () => {
    render(<Navbar />)

    expect(screen.getByText('Trellis')).toBeInTheDocument()
    expect(screen.getByText('Trustless Milestone Escrow')).toBeInTheDocument()
  })

  it('renders the wallet connect action', () => {
    render(<Navbar />)

    expect(screen.getByRole('button', { name: 'Connect Wallet' })).toBeInTheDocument()
  })

  it('links the network badge to the explorer for the active network', () => {
    render(<Navbar />)

    const badge = screen.getByRole('link', { name: /testnet/i })
    expect(badge).toHaveAttribute('href', explorerBaseUrl())
    expect(badge).toHaveAttribute('target', '_blank')
  })

  it('points every outbound link at Stellar Expert', () => {
    render(<Navbar />)

    const links = screen.getAllByRole('link')
    expect(links.length).toBeGreaterThan(0)
    for (const link of links) {
      expect(link.getAttribute('href')).toMatch(/^https:\/\/stellar\.expert\/explorer\//)
    }
  })
})
