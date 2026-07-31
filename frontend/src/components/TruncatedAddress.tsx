import CopyButton from './CopyButton'

interface TruncatedAddressProps {
  address: string
  chars?: number
  label?: string
}

export default function TruncatedAddress({ address, chars = 8, label }: TruncatedAddressProps) {
  const truncated = address.length > chars * 2
    ? `${address.slice(0, chars)}...${address.slice(-chars)}`
    : address

  return (
    <div className="flex items-center gap-2">
      {label && <span className="text-xs text-gray-500 dark:text-gray-500 light:text-gray-600">{label}</span>}
      <code className="text-sm font-mono text-cyan-400 dark:text-cyan-400 light:text-cyan-600 bg-navy-800 dark:bg-navy-800 light:bg-gray-100 px-2 py-1 rounded">
        {truncated}
      </code>
      <CopyButton text={address} />
    </div>
  )
}

export { TruncatedAddress }
