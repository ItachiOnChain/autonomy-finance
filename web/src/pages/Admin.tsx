import { useReadContract } from 'wagmi'
import { config } from '@/lib/config'
import { formatUnits } from '@/lib/utils'
import StatCard from '@/components/StatCard'
import AddressBadge from '@/components/AddressBadge'
import AutonomyV1ABI from '@/abis/AutonomyV1.json'
import AdapterABI from '@/abis/Adapter.json'
import { Settings, Shield, DollarSign, TrendingUp } from 'lucide-react'

export default function Admin() {
  // Read protocol parameters
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

  const { data: maxLiquidationBonus } = useReadContract({
    address: config.contracts.autonomy,
    abi: AutonomyV1ABI,
    functionName: 'MAX_LIQUIDATION_BONUS',
  })

  const { data: oracle } = useReadContract({
    address: config.contracts.autonomy,
    abi: AutonomyV1ABI,
    functionName: 'oracle',
  })

  const { data: apy } = useReadContract({
    address: config.contracts.adapter,
    abi: AdapterABI,
    functionName: 'apy',
  })

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold mb-2">Admin Panel</h1>
        <p className="text-muted-foreground">View protocol parameters and configuration</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        <StatCard
          title="Min Collateralization"
          value={
            minCollateralization
              ? `${formatUnits(minCollateralization as bigint, 18)}x`
              : 'N/A'
          }
          subtitle="Minimum required collateralization ratio"
          icon={Shield}
        />
        <StatCard
          title="Liquidation Threshold"
          value={
            liquidationThreshold
              ? `${formatUnits(liquidationThreshold as bigint, 18)}x`
              : 'N/A'
          }
          subtitle="Threshold for liquidation"
          icon={TrendingUp}
        />
        <StatCard
          title="Max Liquidation Bonus"
          value={
            maxLiquidationBonus
              ? `${(Number(formatUnits(maxLiquidationBonus as bigint, 18)) * 100).toFixed(1)}%`
              : 'N/A'
          }
          subtitle="Maximum liquidation bonus"
          icon={DollarSign}
        />
        <StatCard
          title="Adapter APY"
          value={apy ? `${(Number(formatUnits(apy as bigint, 18)) * 100).toFixed(2)}%` : 'N/A'}
          subtitle="Current adapter APY"
          icon={Settings}
        />
      </div>

      <div className="rounded-lg border border-border p-6">
        <h3 className="text-lg font-semibold mb-4">Contract Addresses</h3>
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-muted-foreground">AutonomyV1</span>
            <AddressBadge address={config.contracts.autonomy} />
          </div>
          <div className="flex items-center justify-between">
            <span className="text-muted-foreground">Adapter</span>
            <AddressBadge address={config.contracts.adapter} />
          </div>
          <div className="flex items-center justify-between">
            <span className="text-muted-foreground">AtAsset</span>
            <AddressBadge address={config.contracts.atAsset} />
          </div>
          <div className="flex items-center justify-between">
            <span className="text-muted-foreground">Collateral Token</span>
            <AddressBadge address={config.contracts.collateral} />
          </div>
          <div className="flex items-center justify-between">
            <span className="text-muted-foreground">Price Oracle</span>
            <AddressBadge address={config.contracts.priceOracle} />
          </div>
          {oracle && (
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground">Oracle (from contract)</span>
              <AddressBadge address={oracle as `0x${string}`} />
            </div>
          )}
        </div>
      </div>

      <div className="rounded-lg border border-border p-6">
        <h3 className="text-lg font-semibold mb-4">Note</h3>
        <p className="text-sm text-muted-foreground">
          This is a read-only admin panel for viewing protocol parameters. Actual admin functions
          (pausing, updating parameters, etc.) can only be called by the contract owner.
        </p>
      </div>
    </div>
  )
}

