import { describe, expect, it } from 'vitest'

import {
  accountUrl,
  assetUrl,
  contractUrl,
  explorerBaseUrl,
  explorerUrl,
  ledgerUrl,
  networkFromPassphrase,
  networkLabel,
  PUBLIC_NETWORK_PASSPHRASE,
  STELLAR_EXPERT_ORIGIN,
  TESTNET_NETWORK_PASSPHRASE,
  truncateId,
  txUrl,
} from './explorer'

const CONTRACT = 'CAUAO7CYKULE2K4EJMQ6LLRUHP7Y7JYOH6G2VBXKYG7PTETE3UZ3DU7Q'
const ACCOUNT = 'GAUAO7CYKULE2K4EJMQ6LLRUHP7Y7JYOH6G2VBXKYG7PTETE3UZ3DU7Q'
const TX_HASH = 'a'.repeat(64)

describe('networkFromPassphrase', () => {
  it('maps the pubnet passphrase to the public network', () => {
    expect(networkFromPassphrase(PUBLIC_NETWORK_PASSPHRASE)).toBe('public')
  })

  it('maps the testnet passphrase to the testnet network', () => {
    expect(networkFromPassphrase(TESTNET_NETWORK_PASSPHRASE)).toBe('testnet')
  })

  it('tolerates surrounding whitespace from .env files', () => {
    expect(networkFromPassphrase(`  ${PUBLIC_NETWORK_PASSPHRASE}  `)).toBe('public')
  })

  it.each([undefined, null, '', 'Test SDF Future Network ; October 2022'])(
    'falls back to testnet for %o rather than throwing',
    (passphrase) => {
      expect(networkFromPassphrase(passphrase)).toBe('testnet')
    },
  )
})

describe('explorerBaseUrl', () => {
  it('builds the explorer root for an explicit network', () => {
    expect(explorerBaseUrl('public')).toBe(`${STELLAR_EXPERT_ORIGIN}/explorer/public`)
    expect(explorerBaseUrl('testnet')).toBe(`${STELLAR_EXPERT_ORIGIN}/explorer/testnet`)
  })
})

describe('explorerUrl', () => {
  it('builds a deep link for each entity type', () => {
    expect(explorerUrl('tx', TX_HASH, 'testnet')).toBe(
      `${STELLAR_EXPERT_ORIGIN}/explorer/testnet/tx/${TX_HASH}`,
    )
    expect(explorerUrl('contract', CONTRACT, 'public')).toBe(
      `${STELLAR_EXPERT_ORIGIN}/explorer/public/contract/${CONTRACT}`,
    )
    expect(explorerUrl('op', '123456', 'testnet')).toBe(
      `${STELLAR_EXPERT_ORIGIN}/explorer/testnet/op/123456`,
    )
  })

  it('trims the identifier before building the path', () => {
    expect(explorerUrl('account', `\n ${ACCOUNT} `, 'testnet')).toBe(
      `${STELLAR_EXPERT_ORIGIN}/explorer/testnet/account/${ACCOUNT}`,
    )
  })

  it('percent-encodes identifiers that contain URL-significant characters', () => {
    expect(explorerUrl('asset', 'USDC/FAKE', 'testnet')).toBe(
      `${STELLAR_EXPERT_ORIGIN}/explorer/testnet/asset/USDC%2FFAKE`,
    )
  })

  it.each([undefined, null, '', '   '])(
    'returns null for the blank identifier %o instead of a dead link',
    (value) => {
      expect(explorerUrl('tx', value, 'testnet')).toBeNull()
    },
  )
})

describe('entity helpers', () => {
  it('delegate to explorerUrl with the matching path segment', () => {
    expect(txUrl(TX_HASH, 'public')).toBe(explorerUrl('tx', TX_HASH, 'public'))
    expect(contractUrl(CONTRACT, 'public')).toBe(explorerUrl('contract', CONTRACT, 'public'))
    expect(accountUrl(ACCOUNT, 'public')).toBe(explorerUrl('account', ACCOUNT, 'public'))
    expect(assetUrl('USDC-GABC', 'public')).toBe(explorerUrl('asset', 'USDC-GABC', 'public'))
  })

  it('accepts a numeric ledger sequence', () => {
    expect(ledgerUrl(42, 'testnet')).toBe(`${STELLAR_EXPERT_ORIGIN}/explorer/testnet/ledger/42`)
  })

  it('does not treat ledger 0 as a missing value', () => {
    expect(ledgerUrl(0, 'testnet')).toBe(`${STELLAR_EXPERT_ORIGIN}/explorer/testnet/ledger/0`)
  })

  it('returns null for a missing ledger sequence', () => {
    expect(ledgerUrl(null, 'testnet')).toBeNull()
    expect(ledgerUrl(undefined, 'testnet')).toBeNull()
  })
})

describe('truncateId', () => {
  it('elides the middle of a long identifier', () => {
    expect(truncateId(CONTRACT)).toBe('CAUA…DU7Q')
  })

  it('honours custom lead and tail lengths', () => {
    expect(truncateId(CONTRACT, 6, 2)).toBe('CAUAO7…7Q')
  })

  it('leaves short values untouched rather than adding a pointless ellipsis', () => {
    expect(truncateId('GABCDEFG')).toBe('GABCDEFG')
    expect(truncateId('')).toBe('')
  })

  it('trims before measuring', () => {
    expect(truncateId('  GABCDEFG  ')).toBe('GABCDEFG')
  })
})

describe('networkLabel', () => {
  it('renders human-readable network names', () => {
    expect(networkLabel('public')).toBe('Mainnet')
    expect(networkLabel('testnet')).toBe('Testnet')
  })
})
