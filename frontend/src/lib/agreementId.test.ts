import { describe, expect, it } from 'vitest'
import { generateAgreementId } from './agreementId'

describe('generateAgreementId', () => {
  it('produces a 64-character hex string', () => {
    const id = generateAgreementId()
    expect(id).toHaveLength(64)
  })

  it('contains only valid hexadecimal characters', () => {
    const id = generateAgreementId()
    expect(id).toMatch(/^[0-9a-f]{64}$/)
  })

  it('generates unique IDs on successive calls', () => {
    const ids = Array.from({ length: 100 }, () => generateAgreementId())
    const unique = new Set(ids)
    expect(unique.size).toBe(100)
  })

  it('has sufficient entropy (at most 5% collisions among 1,000 IDs in theory is ~0%)', () => {
    const ids = Array.from({ length: 1000 }, () => generateAgreementId())
    const unique = new Set(ids)
    // 32 bytes = 256 bits of entropy — collisions are effectively impossible
    expect(unique.size).toBe(1000)
  })

  it('does not produce a predictable pattern of leading characters', () => {
    const firstChars = Array.from({ length: 50 }, () => generateAgreementId()[0])
    const uniqueFirst = new Set(firstChars)
    // With 16 possible hex chars, 50 draws should yield at least 4 distinct ones
    // (p ≈ 1 - (15/16)^50 ≈ 0.96 chance of seeing all 16)
    expect(uniqueFirst.size).toBeGreaterThanOrEqual(4)
  })
})
