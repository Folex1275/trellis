import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { HowItWorks } from '../components/HowItWorks'

/**
 * Tests for HowItWorks component.
 *
 * Covers:
 * - All five workflow steps are rendered (#95)
 * - Section has an accessible heading
 * - SVG icons render without errors (they must not throw)
 */
describe('<HowItWorks />', () => {
  it('renders the section heading', () => {
    render(<HowItWorks />)
    expect(screen.getByRole('heading', { name: 'How It Works' })).toBeInTheDocument()
  })

  it('renders all five step headings', () => {
    render(<HowItWorks />)
    expect(screen.getByRole('heading', { name: 'Create Agreement' })).toBeInTheDocument()
    expect(screen.getByRole('heading', { name: 'Lock Funds' })).toBeInTheDocument()
    expect(screen.getByRole('heading', { name: 'Submit Work' })).toBeInTheDocument()
    expect(screen.getByRole('heading', { name: 'Approve & Release' })).toBeInTheDocument()
    expect(screen.getByRole('heading', { name: 'Dispute (if needed)' })).toBeInTheDocument()
  })

  it('renders the SVG icons without throwing', () => {
    // If any icon import is broken, render() will throw and the test fails.
    expect(() => render(<HowItWorks />)).not.toThrow()
  })

  it('has an ordered list for the steps', () => {
    render(<HowItWorks />)
    // ol has implicit role="list" — steps should be list items
    const list = screen.getByRole('list')
    expect(list.tagName.toLowerCase()).toBe('ol')
    expect(list.querySelectorAll('li').length).toBe(5)
  })
})
