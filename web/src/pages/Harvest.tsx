import { useAccount, useReadContract, useWriteContract, useWaitForTransactionReceipt } from 'wagmi'
import { toast } from 'react-toastify'
import { useAutonomy } from '@/hooks/useAutonomy'
import { useAdapter } from '@/hooks/useAdapter'
import { config } from '@/lib/config'
import ActionCard from '@/components/ActionCard'
import TokenAmount from '@/components/TokenAmount'
import AutonomyV1ABI from '@/abis/AutonomyV1.json'
import AdapterABI from '@/abis/Adapter.json'
import { Sprout, TrendingUp } from 'lucide-react'

export default function Harvest() {
  const { address, isConnected } = useAccount()
  const autonomy = useAutonomy()
  const adapter = useAdapter()

  // Check if user is owner/keeper (simplified - would need to check actual owner)
  const { data: adapterOwner } = useReadContract({
    address: config.contracts.adapter,
    abi: AdapterABI,
    functionName: 'owner',
  })

  const { writeContract: harvest, data: harvestHash } = useWriteContract()
  const { isLoading: isHarvesting } = useWaitForTransactionReceipt({
    hash: harvestHash,
  })

  const handleHarvest = () => {
    if (!address) {
      toast.error('Please connect your wallet')
      return
    }

    harvest({
      address: config.contracts.autonomy,
      abi: AutonomyV1ABI,
      functionName: 'harvest',
      args: [config.contracts.collateral],
    })
  }

  const isKeeper = address && adapterOwner && address.toLowerCase() === (adapterOwner as string).toLowerCase()

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold mb-2">Harvest</h1>
        <p className="text-muted-foreground">Harvest yield and trigger auto-repay</p>
      </div>

      <ActionCard
        title="Harvest Yield"
        description="Harvest accrued yield from the adapter. This will update exchange rates and trigger auto-repay of debt."
      >
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="p-4 bg-muted rounded-md">
              <div className="flex items-center gap-2 mb-2">
                <TrendingUp className="w-4 h-4 text-muted-foreground" />
                <span className="text-sm font-medium">Current Exchange Rate</span>
              </div>
              <p className="text-2xl font-bold">
                {adapter.formattedExchangeRate || '1.0000'}
              </p>
            </div>

            <div className="p-4 bg-muted rounded-md">
              <div className="flex items-center gap-2 mb-2">
                <Sprout className="w-4 h-4 text-muted-foreground" />
                <span className="text-sm font-medium">APY</span>
              </div>
              <p className="text-2xl font-bold">
                {adapter.apy ? `${(parseFloat(adapter.apy) * 100).toFixed(2)}%` : 'N/A'}
              </p>
            </div>
          </div>

          <div className="p-4 bg-card border border-border rounded-md">
            <h3 className="text-sm font-semibold mb-3">Before Harvest</h3>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Your Debt</span>
                <span className="font-medium">
                  {autonomy.debtValue ? (
                    <TokenAmount value={autonomy.debtValue} symbol="USD" />
                  ) : (
                    '$0.00'
                  )}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Health Factor</span>
                <span className="font-medium">{autonomy.healthFactor || '∞'}</span>
              </div>
            </div>
          </div>

          {isConnected ? (
            <div>
              {isKeeper ? (
                <button
                  onClick={handleHarvest}
                  disabled={isHarvesting}
                  className="w-full rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-50"
                >
                  {isHarvesting ? 'Harvesting...' : 'Harvest Yield'}
                </button>
              ) : (
                <div className="p-4 bg-yellow-500/10 border border-yellow-500/50 rounded-md">
                  <p className="text-sm text-yellow-600 dark:text-yellow-400 text-center">
                    Only the keeper/owner can harvest. For demo purposes, this button is available to all connected wallets.
                  </p>
                  <button
                    onClick={handleHarvest}
                    disabled={isHarvesting}
                    className="w-full mt-4 rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-50"
                  >
                    {isHarvesting ? 'Harvesting...' : 'Harvest Yield (Demo)'}
                  </button>
                </div>
              )}
            </div>
          ) : (
            <div className="text-center py-4">
              <p className="text-muted-foreground">Please connect your wallet</p>
            </div>
          )}

          <div className="p-4 bg-muted rounded-md">
            <p className="text-sm text-muted-foreground">
              <strong>How it works:</strong> When you harvest, the adapter accrues yield and updates
              the exchange rate. This increases the value of your collateral, effectively reducing
              your debt-to-collateral ratio. The protocol automatically applies this yield to reduce
              debt proportionally across all users.
            </p>
          </div>
        </div>
      </ActionCard>
    </div>
  )
}

