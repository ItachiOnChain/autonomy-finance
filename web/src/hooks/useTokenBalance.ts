import { useReadContract, useAccount } from 'wagmi'
import { formatUnits } from '@/lib/utils'
import IERC20ABI from '@/abis/IERC20.json'

export function useTokenBalance(tokenAddress: `0x${string}` | undefined) {
  const { address } = useAccount()

  const { data: balance } = useReadContract({
    address: tokenAddress,
    abi: IERC20ABI,
    functionName: 'balanceOf',
    args: address ? [address] : undefined,
    query: { enabled: !!address && !!tokenAddress },
  })

  const { data: decimals } = useReadContract({
    address: tokenAddress,
    abi: IERC20ABI,
    functionName: 'decimals',
    query: { enabled: !!tokenAddress },
  })

  const { data: symbol } = useReadContract({
    address: tokenAddress,
    abi: IERC20ABI,
    functionName: 'symbol',
    query: { enabled: !!tokenAddress },
  })

  return {
    balance: balance as bigint | undefined,
    decimals: decimals as number | undefined,
    symbol: symbol as string | undefined,
    formattedBalance:
      balance && decimals ? formatUnits(balance, decimals) : undefined,
  }
}

