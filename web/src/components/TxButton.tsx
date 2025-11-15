import { useWriteContract, useWaitForTransactionReceipt } from 'wagmi'
import { toast } from 'react-toastify'
import { Loader2 } from 'lucide-react'
import { cn } from '@/lib/utils'
import { useEffect } from 'react'

interface TxButtonProps {
  contractAddress: `0x${string}`
  abi: any[]
  functionName: string
  args?: any[]
  onSuccess?: () => void
  onError?: (error: Error) => void
  children: React.ReactNode
  className?: string
  disabled?: boolean
}

export default function TxButton({
  contractAddress,
  abi,
  functionName,
  args = [],
  onSuccess,
  onError,
  children,
  className,
  disabled,
}: TxButtonProps) {
  const { writeContract, data: hash, isPending, error } = useWriteContract()
  const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({
    hash,
  })

  useEffect(() => {
    if (isSuccess) {
      toast.success('Transaction confirmed!')
      onSuccess?.()
    }
  }, [isSuccess, onSuccess])

  useEffect(() => {
    if (error) {
      const message = error.message || 'Transaction failed'
      toast.error(message)
      onError?.(error)
    }
  }, [error, onError])

  const handleClick = () => {
    writeContract({
      address: contractAddress,
      abi,
      functionName,
      args,
    })
  }

  const isLoading = isPending || isConfirming

  return (
    <button
      onClick={handleClick}
      disabled={disabled || isLoading}
      className={cn(
        'w-full rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2',
        className
      )}
    >
      {isLoading && <Loader2 className="w-4 h-4 animate-spin" />}
      {children}
    </button>
  )
}

