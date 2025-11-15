import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { useAccount, useReadContract, useWriteContract, useWaitForTransactionReceipt } from 'wagmi'
import { toast } from 'react-toastify'
import { useAutonomy } from '@/hooks/useAutonomy'
import { useTokenBalance } from '@/hooks/useTokenBalance'
import { config } from '@/lib/config'
import { parseUnits } from '@/lib/utils'
import ActionCard from '@/components/ActionCard'
import NumberInput from '@/components/NumberInput'
import TokenAmount from '@/components/TokenAmount'
import AutonomyV1ABI from '@/abis/AutonomyV1.json'
import IERC20ABI from '@/abis/IERC20.json'

const mintSchema = z.object({
  amount: z.string().min(1, 'Amount is required'),
})

const repaySchema = z.object({
  amount: z.string().min(1, 'Amount is required'),
})

type MintForm = z.infer<typeof mintSchema>
type RepayForm = z.infer<typeof repaySchema>

export default function Borrow() {
  const { address, isConnected } = useAccount()
  const autonomy = useAutonomy()
  const atAssetBalance = useTokenBalance(config.contracts.atAsset)

  const [isMinting, setIsMinting] = useState(true)

  const mintForm = useForm<MintForm>({
    resolver: zodResolver(mintSchema),
  })

  const repayForm = useForm<RepayForm>({
    resolver: zodResolver(repaySchema),
  })

  const { writeContract: mint, data: mintHash } = useWriteContract()
  const { isLoading: isMintingTx } = useWaitForTransactionReceipt({
    hash: mintHash,
  })

  const { data: allowance } = useReadContract({
    address: config.contracts.atAsset,
    abi: IERC20ABI,
    functionName: 'allowance',
    args: address ? [address, config.contracts.autonomy] : undefined,
    query: { enabled: !!address && !isMinting },
  })

  const { writeContract: approve } = useWriteContract()
  const { writeContract: repay, data: repayHash } = useWriteContract()
  const { isLoading: isRepaying } = useWaitForTransactionReceipt({
    hash: repayHash,
  })

  const handleMint = (data: MintForm) => {
    if (!address) {
      toast.error('Please connect your wallet')
      return
    }

    const amount = parseUnits(data.amount, 18)

    mint({
      address: config.contracts.autonomy,
      abi: AutonomyV1ABI,
      functionName: 'mint',
      args: [config.contracts.atAsset, amount, address],
    })
  }

  const handleRepay = (data: RepayForm) => {
    if (!address) {
      toast.error('Please connect your wallet')
      return
    }

    const amount = parseUnits(data.amount, 18)
    const currentAllowance = (allowance as bigint) || 0n

    if (currentAllowance < amount) {
      approve({
        address: config.contracts.atAsset,
        abi: IERC20ABI,
        functionName: 'approve',
        args: [config.contracts.autonomy, amount],
      })
      return
    }

    repay({
      address: config.contracts.autonomy,
      abi: AutonomyV1ABI,
      functionName: 'repay',
      args: [config.contracts.atAsset, amount, address],
    })
  }

  if (!isConnected) {
    return (
      <div className="text-center py-12">
        <p className="text-muted-foreground">Please connect your wallet to borrow</p>
      </div>
    )
  }

  const repayAmount = repayForm.watch('amount')
  const needsApproval =
    repayAmount && allowance && (allowance as bigint) < parseUnits(repayAmount, 18)

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold mb-2">Borrow</h1>
        <p className="text-muted-foreground">Mint atAssets or repay your debt</p>
      </div>

      <div className="flex gap-2 mb-6">
        <button
          onClick={() => setIsMinting(true)}
          className={`px-4 py-2 rounded-md ${
            isMinting
              ? 'bg-primary text-primary-foreground'
              : 'bg-muted text-muted-foreground'
          }`}
        >
          Mint
        </button>
        <button
          onClick={() => setIsMinting(false)}
          className={`px-4 py-2 rounded-md ${
            !isMinting
              ? 'bg-primary text-primary-foreground'
              : 'bg-muted text-muted-foreground'
          }`}
        >
          Repay
        </button>
      </div>

      {isMinting ? (
        <ActionCard
          title="Mint atAsset"
          description="Mint debt tokens against your collateral (minimum 150% collateralization required)"
        >
          <div className="space-y-4">
            <div className="p-4 bg-muted rounded-md space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Collateral Value</span>
                <span className="font-medium">
                  {autonomy.collateralValue ? (
                    <TokenAmount value={autonomy.collateralValue} symbol="USD" />
                  ) : (
                    '$0.00'
                  )}
                </span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Current Debt</span>
                <span className="font-medium">
                  {autonomy.debtValue ? (
                    <TokenAmount value={autonomy.debtValue} symbol="USD" />
                  ) : (
                    '$0.00'
                  )}
                </span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Health Factor</span>
                <span className="font-medium">{autonomy.healthFactor || '∞'}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Max Borrowable</span>
                <span className="font-medium">
                  {autonomy.liquidationLimit ? (
                    <TokenAmount value={autonomy.liquidationLimit} symbol="USD" />
                  ) : (
                    '$0.00'
                  )}
                </span>
              </div>
            </div>

            <form onSubmit={mintForm.handleSubmit(handleMint)} className="space-y-4">
              <div>
                <label className="text-sm font-medium mb-2 block">Amount</label>
                <NumberInput
                  {...mintForm.register('amount')}
                  placeholder="0.00"
                />
                {mintForm.formState.errors.amount && (
                  <p className="text-sm text-destructive mt-1">
                    {mintForm.formState.errors.amount.message}
                  </p>
                )}
              </div>

              <button
                type="submit"
                disabled={isMintingTx}
                className="w-full rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-50"
              >
                {isMintingTx ? 'Minting...' : 'Mint'}
              </button>
            </form>

            {autonomy.collateralValue === 0n && (
              <div className="mt-4 p-4 bg-yellow-500/10 border border-yellow-500/50 rounded-md">
                <p className="text-sm text-yellow-600 dark:text-yellow-400">
                  You need to deposit collateral first
                </p>
              </div>
            )}
          </div>
        </ActionCard>
      ) : (
        <ActionCard
          title="Repay Debt"
          description="Repay your debt by burning atAsset tokens"
        >
          <div className="space-y-4">
            <div className="flex justify-between text-sm text-muted-foreground">
              <span>Your Debt</span>
              <span>
                {autonomy.userDebt ? (
                  <TokenAmount value={autonomy.userDebt} symbol="atUSD" />
                ) : (
                  '0.00 atUSD'
                )}
              </span>
            </div>

            <div className="flex justify-between text-sm text-muted-foreground">
              <span>atAsset Balance</span>
              <span>
                {atAssetBalance.formattedBalance || '0.00'}{' '}
                {atAssetBalance.symbol || ''}
              </span>
            </div>

            <form onSubmit={repayForm.handleSubmit(handleRepay)} className="space-y-4">
              <div>
                <label className="text-sm font-medium mb-2 block">Amount</label>
                <NumberInput
                  {...repayForm.register('amount')}
                  placeholder="0.00"
                  onMaxClick={() => {
                    if (atAssetBalance.formattedBalance) {
                      repayForm.setValue('amount', atAssetBalance.formattedBalance)
                    }
                  }}
                />
                {repayForm.formState.errors.amount && (
                  <p className="text-sm text-destructive mt-1">
                    {repayForm.formState.errors.amount.message}
                  </p>
                )}
              </div>

              {needsApproval ? (
                <button
                  type="button"
                  onClick={() => {
                    const amount = repayForm.watch('amount')
                    if (amount) {
                      approve({
                        address: config.contracts.atAsset,
                        abi: IERC20ABI,
                        functionName: 'approve',
                        args: [config.contracts.autonomy, parseUnits(amount, 18)],
                      })
                    }
                  }}
                  className="w-full rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-50"
                >
                  Approve
                </button>
              ) : (
                <button
                  type="submit"
                  disabled={isRepaying}
                  className="w-full rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-50"
                >
                  {isRepaying ? 'Repaying...' : 'Repay'}
                </button>
              )}
            </form>
          </div>
        </ActionCard>
      )}
    </div>
  )
}

