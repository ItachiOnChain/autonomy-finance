import { useAccount } from 'wagmi'
import { useAutonomy } from '@/hooks/useAutonomy'
import { useAdapter } from '@/hooks/useAdapter'
import { useTokenBalance } from '@/hooks/useTokenBalance'
import { config } from '@/lib/config'
import StatCard from '@/components/StatCard'
import TokenAmount from '@/components/TokenAmount'
import { Wallet, TrendingUp, AlertTriangle, DollarSign } from 'lucide-react'

export default function Dashboard() {
  const { address, isConnected } = useAccount()
  const autonomy = useAutonomy()
  const adapter = useAdapter()
  const collateralBalance = useTokenBalance(config.contracts.collateral)
  const atAssetBalance = useTokenBalance(config.contracts.atAsset)

  if (!isConnected) {
    return (
      <div className="text-center py-12">
        <p className="text-muted-foreground">Please connect your wallet to view your dashboard</p>
      </div>
    )
  }

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold mb-2">Dashboard</h1>
        <p className="text-muted-foreground">Overview of your positions and protocol stats</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Collateral Deposited"
          value={
            autonomy.collateralValue ? (
              <TokenAmount value={autonomy.collateralValue} symbol="USD" />
            ) : (
              '$0.00'
            )
          }
          icon={Wallet}
          variant={autonomy.collateralValue && autonomy.collateralValue > 0n ? 'success' : 'default'}
        />
        <StatCard
          title="Total Debt"
          value={
            autonomy.debtValue ? (
              <TokenAmount value={autonomy.debtValue} symbol="USD" />
            ) : (
              '$0.00'
            )
          }
          icon={DollarSign}
          variant={autonomy.debtValue && autonomy.debtValue > 0n ? 'warning' : 'default'}
        />
        <StatCard
          title="Health Factor"
          value={autonomy.healthFactor || '∞'}
          subtitle={autonomy.isLiquidatable ? 'Position is liquidatable' : 'Position is safe'}
          icon={autonomy.isLiquidatable ? AlertTriangle : TrendingUp}
          variant={
            autonomy.isLiquidatable
              ? 'danger'
              : autonomy.healthFactor && parseFloat(autonomy.healthFactor) < 1.5
                ? 'warning'
                : 'success'
          }
        />
        <StatCard
          title="Exchange Rate"
          value={adapter.formattedExchangeRate || '1.0000'}
          subtitle={adapter.apy ? `APY: ${(parseFloat(adapter.apy) * 100).toFixed(2)}%` : undefined}
          icon={TrendingUp}
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="rounded-lg border border-border p-6">
          <h3 className="text-lg font-semibold mb-4">Your Balances</h3>
          <div className="space-y-2">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Collateral Token</span>
              <span className="font-medium">
                {collateralBalance.formattedBalance || '0.00'} {collateralBalance.symbol || ''}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">atAsset</span>
              <span className="font-medium">
                {atAssetBalance.formattedBalance || '0.00'} {atAssetBalance.symbol || ''}
              </span>
            </div>
          </div>
        </div>

        <div className="rounded-lg border border-border p-6">
          <h3 className="text-lg font-semibold mb-4">Protocol Stats</h3>
          <div className="space-y-2">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Total Deposited</span>
              <span className="font-medium">
                {autonomy.totalDeposited ? (
                  <TokenAmount value={autonomy.totalDeposited} symbol="USD" />
                ) : (
                  '$0.00'
                )}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Total Debt</span>
              <span className="font-medium">
                {autonomy.totalDebt ? (
                  <TokenAmount value={autonomy.totalDebt} symbol="USD" />
                ) : (
                  '$0.00'
                )}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Min Collateralization</span>
              <span className="font-medium">{autonomy.minCollateralization}x</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

