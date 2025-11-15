import { useReadContract, useAccount, useReadContracts } from 'wagmi'
import { config } from '@/lib/config'
import { formatUnits, formatHealthFactor } from '@/lib/utils'
import AutonomyV1ABI from '@/abis/AutonomyV1.json'

export function useAutonomy() {
  const { address } = useAccount()

  // Read constants
  const { data: minCollateralization } = useReadContract({
    address: config.contracts.autonomy,
    abi: AutonomyV1ABI,
    functionName: 'MINIMUM_COLLATERALIZATION_RATIO',
  })

  const { data: liquidationThreshold } = useReadContract({
    address: config.contracts.autonomy,
    abi: AutonomyV1ABI,
    functionName: 'LIQUIDATION_THRESHOLD',
  })

  // Read user position data
  const contracts = address
    ? [
        {
          address: config.contracts.autonomy,
          abi: AutonomyV1ABI,
          functionName: 'getCollateralValue',
          args: [address],
        },
        {
          address: config.contracts.autonomy,
          abi: AutonomyV1ABI,
          functionName: 'getDebtValue',
          args: [address],
        },
        {
          address: config.contracts.autonomy,
          abi: AutonomyV1ABI,
          functionName: 'getLiquidationLimit',
          args: [address],
        },
        {
          address: config.contracts.autonomy,
          abi: AutonomyV1ABI,
          functionName: 'isLiquidatable',
          args: [address],
        },
        {
          address: config.contracts.autonomy,
          abi: AutonomyV1ABI,
          functionName: 'getDebt',
          args: [address, config.contracts.atAsset],
        },
      ]
    : []

  const { data: positionData } = useReadContracts({ contracts })

  const [collateralValue, debtValue, liquidationLimit, isLiquidatable, userDebt] =
    positionData || []

  // Read deposited shares (simplified - would need to iterate over yield tokens)
  const { data: depositedShares } = useReadContract({
    address: config.contracts.autonomy,
    abi: AutonomyV1ABI,
    functionName: 'depositedShares',
    args: address ? [address, config.contracts.collateral] : undefined,
    query: { enabled: !!address },
  })

  // Read total deposited
  const { data: totalDeposited } = useReadContract({
    address: config.contracts.autonomy,
    abi: AutonomyV1ABI,
    functionName: 'getTotalDeposited',
    args: [config.contracts.collateral],
  })

  // Read total debt
  const { data: totalDebt } = useReadContract({
    address: config.contracts.autonomy,
    abi: AutonomyV1ABI,
    functionName: 'getTotalDebt',
    args: [config.contracts.atAsset],
  })

  return {
    // Constants
    minCollateralization: minCollateralization
      ? formatUnits(minCollateralization as bigint)
      : '1.5',
    liquidationThreshold: liquidationThreshold
      ? formatUnits(liquidationThreshold as bigint)
      : '1.2',

    // User position
    collateralValue: collateralValue?.result as bigint | undefined,
    debtValue: debtValue?.result as bigint | undefined,
    liquidationLimit: liquidationLimit?.result as bigint | undefined,
    isLiquidatable: isLiquidatable?.result as boolean | undefined,
    userDebt: userDebt?.result as bigint | undefined,
    depositedShares: depositedShares as bigint | undefined,

    // Protocol totals
    totalDeposited: totalDeposited as bigint | undefined,
    totalDebt: totalDebt as bigint | undefined,

    // Computed
    healthFactor:
      collateralValue?.result && debtValue?.result
        ? formatHealthFactor(
            collateralValue.result as bigint,
            debtValue.result as bigint
          )
        : undefined,
  }
}

