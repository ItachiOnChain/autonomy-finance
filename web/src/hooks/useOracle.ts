import { useReadContract } from 'wagmi'
import { config } from '@/lib/config'
import { formatUnits } from '@/lib/utils'
import MockOracleABI from '@/abis/MockOracle.json'

export function useOracle() {
  const { data: collateralPrice } = useReadContract({
    address: config.contracts.priceOracle,
    abi: MockOracleABI,
    functionName: 'priceInDebt',
    args: [config.contracts.collateral],
  })

  const { data: atAssetPrice } = useReadContract({
    address: config.contracts.priceOracle,
    abi: MockOracleABI,
    functionName: 'priceInDebt',
    args: [config.contracts.atAsset],
  })

  return {
    collateralPrice: collateralPrice as bigint | undefined,
    atAssetPrice: atAssetPrice as bigint | undefined,
    formattedCollateralPrice: collateralPrice
      ? formatUnits(collateralPrice as bigint, 18)
      : '1.0',
    formattedAtAssetPrice: atAssetPrice
      ? formatUnits(atAssetPrice as bigint, 18)
      : '1.0',
  }
}

