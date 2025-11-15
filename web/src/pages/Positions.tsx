import { useAccount } from 'wagmi'
import { useAutonomy } from '@/hooks/useAutonomy'
import { useAdapter } from '@/hooks/useAdapter'
import { useTokenBalance } from '@/hooks/useTokenBalance'
import { config } from '@/lib/config'
import { formatUnits } from '@/lib/utils'
import StatCard from '@/components/StatCard'
import TokenAmount from '@/components/TokenAmount'
import { Wallet, TrendingDown, AlertTriangle, DollarSign, Shield } from 'lucide-react'
import { Link } from 'react-router-dom'

export default function Positions() {
  const { address, isConnected } = useAccount()
  const autonomy = useAutonomy()
  const adapter = useAdapter()
  const collateralBalance = useTokenBalance(config.contracts.collateral)
  const atAssetBalance = useTokenBalance(config.contracts.atAsset)

  if (!isConnected) {
    return (
      <div className="text-center py-12">
        <p className="text-muted-foreground">Please connect your wallet to view your positions</p>
      </div>
    )
  }

  const hasPosition =
    (autonomy.collateralValue && autonomy.collateralValue > 0n) ||
    (autonomy.debtValue && autonomy.debtValue > 0n)

  if (!hasPosition) {
    return (
      <div className="space-y-8">
        <div>
          <h1 className="text-3xl font-bold mb-2">Positions</h1>
          <p className="text-muted-foreground">Your lending and borrowing positions</p>
        </div>

        <div className="text-center py-12 rounded-lg border border-border">
          <p className="text-muted-foreground mb-4">You don't have any positions yet</p>
          <div className="flex gap-4 justify-center">
            <Link
              to="/vault"
              className="px-4 py-2 rounded-md bg-primary text-primary-foreground hover:bg-primary/90"
            >
              Deposit Collateral
            </Link>
            <Link
              to="/borrow"
              className="px-4 py-2 rounded-md bg-secondary text-secondary-foreground hover:bg-secondary/90"
            >
              Borrow
            </Link>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold mb-2">Positions</h1>
        <p className="text-muted-foreground">Your lending and borrowing positions</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        <StatCard
          title="Collateral Value"
          value={
            autonomy.collateralValue ? (
              <TokenAmount value={autonomy.collateralValue} symbol="USD" />
            ) : (
              '$0.00'
            )
          }
          subtitle={
            autonomy.depositedShares
              ? `${formatUnits(autonomy.depositedShares, 18)} shares`
              : undefined
          }
          icon={Shield}
          variant="success"
        />
        <StatCard
          title="Debt Value"
          value={
            autonomy.debtValue ? (
              <TokenAmount value={autonomy.debtValue} symbol="USD" />
            ) : (
              '$0.00'
            )
          }
          subtitle={
            autonomy.userDebt
              ? `${formatUnits(autonomy.userDebt, 18)} atUSD`
              : undefined
          }
          icon={DollarSign}
          variant={autonomy.debtValue && autonomy.debtValue > 0n ? 'warning' : 'default'}
        />
        <StatCard
          title="Health Factor"
          value={autonomy.healthFactor || '∞'}
          subtitle={
            autonomy.isLiquidatable
              ? 'Position is liquidatable'
              : autonomy.healthFactor && parseFloat(autonomy.healthFactor) < 1.5
                ? 'Below minimum collateralization'
                : 'Position is safe'
          }
          icon={autonomy.isLiquidatable ? AlertTriangle : TrendingDown}
          variant={
            autonomy.isLiquidatable
              ? 'danger'
              : autonomy.healthFactor && parseFloat(autonomy.healthFactor) < 1.5
                ? 'warning'
                : 'success'
          }
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="rounded-lg border border-border p-6">
          <h3 className="text-lg font-semibold mb-4">Collateral Position</h3>
          <div className="space-y-3">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Deposited Shares</span>
              <span className="font-medium">
                {autonomy.depositedShares ? (
                  <TokenAmount value={autonomy.depositedShares} />
                ) : (
                  '0.00'
                )}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Collateral Value</span>
              <span className="font-medium">
                {autonomy.collateralValue ? (
                  <TokenAmount value={autonomy.collateralValue} symbol="USD" />
                ) : (
                  '$0.00'
                )}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Exchange Rate</span>
              <span className="font-medium">{adapter.formattedExchangeRate || '1.0000'}</span>
            </div>
            <Link
              to="/vault"
              className="block mt-4 text-center px-4 py-2 rounded-md bg-primary text-primary-foreground hover:bg-primary/90"
            >
              Manage Vault
            </Link>
          </div>
        </div>

        <div className="rounded-lg border border-border p-6">
          <h3 className="text-lg font-semibold mb-4">Debt Position</h3>
          <div className="space-y-3">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Debt Amount</span>
              <span className="font-medium">
                {autonomy.userDebt ? (
                  <TokenAmount value={autonomy.userDebt} symbol="atUSD" />
                ) : (
                  '0.00 atUSD'
                )}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Debt Value</span>
              <span className="font-medium">
                {autonomy.debtValue ? (
                  <TokenAmount value={autonomy.debtValue} symbol="USD" />
                ) : (
                  '$0.00'
                )}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Liquidation Limit</span>
              <span className="font-medium">
                {autonomy.liquidationLimit ? (
                  <TokenAmount value={autonomy.liquidationLimit} symbol="USD" />
                ) : (
                  '$0.00'
                )}
              </span>
            </div>
            <Link
              to="/borrow"
              className="block mt-4 text-center px-4 py-2 rounded-md bg-primary text-primary-foreground hover:bg-primary/90"
            >
              Manage Debt
            </Link>
          </div>
        </div>
      </div>

      <div className="rounded-lg border border-border p-6">
        <h3 className="text-lg font-semibold mb-4">Token Balances</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="flex justify-between p-3 bg-muted rounded-md">
            <span className="text-muted-foreground">Collateral Token</span>
            <span className="font-medium">
              {collateralBalance.formattedBalance || '0.00'}{' '}
              {collateralBalance.symbol || ''}
            </span>
          </div>
          <div className="flex justify-between p-3 bg-muted rounded-md">
            <span className="text-muted-foreground">atAsset</span>
            <span className="font-medium">
              {atAssetBalance.formattedBalance || '0.00'}{' '}
              {atAssetBalance.symbol || ''}
            </span>
          </div>
        </div>
      </div>

      {autonomy.isLiquidatable && (
        <div className="rounded-lg border border-red-500/50 bg-red-500/10 p-6">
          <div className="flex items-center gap-2 mb-2">
            <AlertTriangle className="w-5 h-5 text-red-500" />
            <h3 className="text-lg font-semibold text-red-600 dark:text-red-400">
              Position is Liquidatable
            </h3>
          </div>
          <p className="text-sm text-red-600 dark:text-red-400">
            Your position is below the liquidation threshold (120%). Consider depositing more
            collateral or repaying debt to avoid liquidation.
          </p>
        </div>
      )}
    </div>
  )
}

