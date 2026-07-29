import { useState } from 'react'

interface TruncatedAddressProps {
  address: string
  chars?: number
  label?: string
}

export default function TruncatedAddress({ address, chars = 8, label }: TruncatedAddressProps) {
  const [copied, setCopied] = useState(false)

  const truncated = address.length > chars * 2
    ? `${address.slice(0, chars)}...${address.slice(-chars)}`
    : address

  const handleCopy = async () => {
    await navigator.clipboard.writeText(address)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <div className="flex items-center gap-2">
      {label && <span className="text-xs text-gray-500 dark:text-gray-500 light:text-gray-600">{label}</span>}
      <code className="text-sm font-mono text-cyan-400 dark:text-cyan-400 light:text-cyan-600 bg-navy-800 dark:bg-navy-800 light:bg-gray-100 px-2 py-1 rounded">
        {truncated}
      </code>
      <button
        onClick={handleCopy}
        className="p-1.5 hover:bg-navy-700 dark:hover:bg-navy-700 light:hover:bg-gray-200 rounded transition-colors"
        title={copied ? 'Copied!' : 'Copy to clipboard'}
        aria-label="Copy address"
      >
        {copied ? (
          <svg className="w-4 h-4 text-green-400" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
          </svg>
        ) : (
          <svg className="w-4 h-4 text-gray-400 dark:text-gray-400 light:text-gray-600" fill="currentColor" viewBox="0 0 20 20">
            <path d="M8 3a1 1 0 011-1h2a1 1 0 110 2H9a1 1 0 01-1-1z" />
            <path d="M6 3a2 2 0 00-2 2v11a2 2 0 002 2h8a2 2 0 002-2V5a2 2 0 00-2-2 1 1 0 100 2h.5a.5.5 0 01.5.5v11a.5.5 0 01-.5.5h-8a.5.5 0 01-.5-.5V5a.5.5 0 01.5-.5H6a1 1 0 100-2z" />
          </svg>
        )}
      </button>
    </div>
  )
}

export { TruncatedAddress }
