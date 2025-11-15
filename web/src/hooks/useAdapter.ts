import { useReadContract } from 'wagmi'
import { config } from '@/lib/config'
import { formatUnits } from '@/lib/utils'
import AdapterABI from '@/abis/Adapter.json'
import RWAAdapterABI from '@/abis/RWAAdapter.json'

export function useAdapter(isRWA = false) {
  const adapterAddress = isRWA ? config.contracts.rwaAdapter : config.contracts.adapter
  const abi = isRWA ? RWAAdapterABI : AdapterABI

  const { data: exchangeRate } = useReadContract({
    address: adapterAddress,
    abi,
    functionName: 'getExchangeRate',
  })

  const { data: totalValue } = useReadContract({
    address: adapterAddress,
    abi,
    functionName: 'totalValue',
  })

  // For regular adapter, get APY
  const { data: apy } = useReadContract({
    address: adapterAddress,
    abi: AdapterABI,
    functionName: 'apy',
    query: { enabled: !isRWA },
  })

  // For RWA adapter, get buffer info
  const { data: liquidityBuffer } = useReadContract({
    address: adapterAddress,
    abi: RWAAdapterABI,
    functionName: 'liquidityBuffer',
    query: { enabled: isRWA },
  })

  const { data: bufferCap } = useReadContract({
    address: adapterAddress,
    abi: RWAAdapterABI,
    functionName: 'bufferCap',
    query: { enabled: isRWA },
  })

  return {
    exchangeRate: exchangeRate as bigint | undefined,
    totalValue: totalValue as bigint | undefined,
    apy: apy ? formatUnits(apy as bigint) : undefined,
    liquidityBuffer: liquidityBuffer as bigint | undefined,
    bufferCap: bufferCap as bigint | undefined,
    formattedExchangeRate: exchangeRate
      ? formatUnits(exchangeRate as bigint, 18)
      : undefined,
  }
}

