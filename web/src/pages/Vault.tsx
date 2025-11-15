import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { useAccount, useReadContract, useWriteContract, useWaitForTransactionReceipt } from 'wagmi'
import { toast } from 'react-toastify'
import { useAutonomy } from '@/hooks/useAutonomy'
import { useTokenBalance } from '@/hooks/useTokenBalance'
import { config } from '@/lib/config'
import { parseUnits, formatUnits } from '@/lib/utils'
import ActionCard from '@/components/ActionCard'
import NumberInput from '@/components/NumberInput'
import TxButton from '@/components/TxButton'
import TokenAmount from '@/components/TokenAmount'
import AutonomyV1ABI from '@/abis/AutonomyV1.json'
import IERC20ABI from '@/abis/IERC20.json'

const depositSchema = z.object({
  amount: z.string().min(1, 'Amount is required'),
})

const withdrawSchema = z.object({
  shares: z.string().min(1, 'Shares is required'),
})

type DepositForm = z.infer<typeof depositSchema>
type WithdrawForm = z.infer<typeof withdrawSchema>

export default function Vault() {
  const { address, isConnected } = useAccount()
  const autonomy = useAutonomy()
  const collateralBalance = useTokenBalance(config.contracts.collateral)

  const [isDepositing, setIsDepositing] = useState(true)

  const depositForm = useForm<DepositForm>({
    resolver: zodResolver(depositSchema),
  })

  const withdrawForm = useForm<WithdrawForm>({
    resolver: zodResolver(withdrawSchema),
  })

  // Check allowance for deposit
  const { data: allowance } = useReadContract({
    address: config.contracts.collateral,
    abi: IERC20ABI,
    functionName: 'allowance',
    args: address ? [address, config.contracts.autonomy] : undefined,
    query: { enabled: !!address },
  })

  const { writeContract: approve, data: approveHash } = useWriteContract()
  const { isLoading: isApproving } = useWaitForTransactionReceipt({
    hash: approveHash,
  })

  const { writeContract: deposit, data: depositHash } = useWriteContract()
  const { isLoading: isDepositingTx } = useWaitForTransactionReceipt({
    hash: depositHash,
  })

  const { writeContract: withdraw, data: withdrawHash } = useWriteContract()
  const { isLoading: isWithdrawing } = useWaitForTransactionReceipt({
    hash: withdrawHash,
  })

  const handleApprove = () => {
    const amount = depositForm.watch('amount')
    if (!amount) {
      toast.error('Please enter an amount')
      return
    }

    approve({
      address: config.contracts.collateral,
      abi: IERC20ABI,
      functionName: 'approve',
      args: [config.contracts.autonomy, parseUnits(amount, 18)],
    })
  }

  const handleDeposit = (data: DepositForm) => {
    if (!address) {
      toast.error('Please connect your wallet')
      return
    }

    const amount = parseUnits(data.amount, 18)
    const currentAllowance = (allowance as bigint) || 0n

    if (currentAllowance < amount) {
      toast.error('Please approve first')
      return
    }

    deposit({
      address: config.contracts.autonomy,
      abi: AutonomyV1ABI,
      functionName: 'deposit',
      args: [config.contracts.collateral, amount, address],
    })
  }

  const handleWithdraw = (data: WithdrawForm) => {
    if (!address) {
      toast.error('Please connect your wallet')
      return
    }

    const shares = parseUnits(data.shares, 18)

    withdraw({
      address: config.contracts.autonomy,
      abi: AutonomyV1ABI,
      functionName: 'withdraw',
      args: [config.contracts.collateral, shares, address],
    })
  }

  if (!isConnected) {
    return (
      <div className="text-center py-12">
        <p className="text-muted-foreground">Please connect your wallet to use the vault</p>
      </div>
    )
  }

  const depositAmount = depositForm.watch('amount')
  const needsApproval =
    depositAmount &&
    allowance &&
    (allowance as bigint) < parseUnits(depositAmount, 18)

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold mb-2">Vault</h1>
        <p className="text-muted-foreground">Deposit collateral or withdraw your position</p>
      </div>

      <div className="flex gap-2 mb-6">
        <button
          onClick={() => setIsDepositing(true)}
          className={`px-4 py-2 rounded-md ${
            isDepositing
              ? 'bg-primary text-primary-foreground'
              : 'bg-muted text-muted-foreground'
          }`}
        >
          Deposit
        </button>
        <button
          onClick={() => setIsDepositing(false)}
          className={`px-4 py-2 rounded-md ${
            !isDepositing
              ? 'bg-primary text-primary-foreground'
              : 'bg-muted text-muted-foreground'
          }`}
        >
          Withdraw
        </button>
      </div>

      {isDepositing ? (
        <ActionCard
          title="Deposit Collateral"
          description="Deposit collateral tokens to earn yield and enable borrowing"
        >
          <div className="space-y-4">
            <div className="flex justify-between text-sm text-muted-foreground">
              <span>Balance</span>
              <span>
                {collateralBalance.formattedBalance || '0.00'}{' '}
                {collateralBalance.symbol || ''}
              </span>
            </div>

            <form onSubmit={depositForm.handleSubmit(handleDeposit)} className="space-y-4">
              <div>
                <label className="text-sm font-medium mb-2 block">Amount</label>
                <NumberInput
                  {...depositForm.register('amount')}
                  placeholder="0.00"
                  onMaxClick={() => {
                    if (collateralBalance.formattedBalance) {
                      depositForm.setValue('amount', collateralBalance.formattedBalance)
                    }
                  }}
                />
                {depositForm.formState.errors.amount && (
                  <p className="text-sm text-destructive mt-1">
                    {depositForm.formState.errors.amount.message}
                  </p>
                )}
              </div>

              {needsApproval ? (
                <button
                  type="button"
                  onClick={handleApprove}
                  disabled={isApproving}
                  className="w-full rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-50"
                >
                  {isApproving ? 'Approving...' : 'Approve'}
                </button>
              ) : (
                <button
                  type="submit"
                  disabled={isDepositingTx}
                  className="w-full rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-50"
                >
                  {isDepositingTx ? 'Depositing...' : 'Deposit'}
                </button>
              )}
            </form>

            {autonomy.depositedShares && autonomy.depositedShares > 0n && (
              <div className="mt-4 p-4 bg-muted rounded-md">
                <p className="text-sm text-muted-foreground">Your Deposited Shares</p>
                <p className="text-lg font-semibold">
                  <TokenAmount value={autonomy.depositedShares} />
                </p>
              </div>
            )}
          </div>
        </ActionCard>
      ) : (
        <ActionCard
          title="Withdraw Collateral"
          description="Withdraw your collateral while maintaining minimum collateralization"
        >
          <div className="space-y-4">
            <div className="flex justify-between text-sm text-muted-foreground">
              <span>Deposited Shares</span>
              <span>
                {autonomy.depositedShares ? (
                  <TokenAmount value={autonomy.depositedShares} />
                ) : (
                  '0.00'
                )}
              </span>
            </div>

            <form onSubmit={withdrawForm.handleSubmit(handleWithdraw)} className="space-y-4">
              <div>
                <label className="text-sm font-medium mb-2 block">Shares</label>
                <NumberInput
                  {...withdrawForm.register('shares')}
                  placeholder="0.00"
                  onMaxClick={() => {
                    if (autonomy.depositedShares) {
                      withdrawForm.setValue('shares', formatUnits(autonomy.depositedShares, 18))
                    }
                  }}
                />
                {withdrawForm.formState.errors.shares && (
                  <p className="text-sm text-destructive mt-1">
                    {withdrawForm.formState.errors.shares.message}
                  </p>
                )}
              </div>

              <button
                type="submit"
                disabled={isWithdrawing}
                className="w-full rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-50"
              >
                {isWithdrawing ? 'Withdrawing...' : 'Withdraw'}
              </button>
            </form>

            {autonomy.healthFactor && parseFloat(autonomy.healthFactor) < 1.5 && (
              <div className="mt-4 p-4 bg-yellow-500/10 border border-yellow-500/50 rounded-md">
                <p className="text-sm text-yellow-600 dark:text-yellow-400">
                  Warning: Withdrawal may make your position undercollateralized
                </p>
              </div>
            )}
          </div>
        </ActionCard>
      )}
    </div>
  )
}

