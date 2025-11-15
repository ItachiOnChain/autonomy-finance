import { formatUnits } from '@/lib/utils'

interface TokenAmountProps {
  value: bigint
  decimals?: number
  symbol?: string
  showSymbol?: boolean
}

export default function TokenAmount({
  value,
  decimals = 18,
  symbol,
  showSymbol = true,
}: TokenAmountProps) {
  const formatted = formatUnits(value, decimals)
  const [integer, decimal] = formatted.split('.')

  return (
    <span>
      {integer}
      {decimal && `.${decimal.slice(0, 6)}`}
      {showSymbol && symbol && ` ${symbol}`}
    </span>
  )
}

