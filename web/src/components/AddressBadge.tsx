import { formatAddress } from '@/lib/utils'
import { ExternalLink } from 'lucide-react'

interface AddressBadgeProps {
  address: string
  explorerUrl?: string
}

export default function AddressBadge({ address, explorerUrl }: AddressBadgeProps) {
  const formatted = formatAddress(address)

  return (
    <div className="inline-flex items-center gap-2 px-2 py-1 rounded-md bg-muted text-sm font-mono">
      <span>{formatted}</span>
      {explorerUrl && (
        <a
          href={`${explorerUrl}/address/${address}`}
          target="_blank"
          rel="noopener noreferrer"
          className="text-primary hover:text-primary/80"
        >
          <ExternalLink className="w-3 h-3" />
        </a>
      )}
    </div>
  )
}

