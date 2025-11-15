import { forwardRef } from 'react'
import { cn } from '@/lib/utils'

interface NumberInputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  onMaxClick?: () => void
}

const NumberInput = forwardRef<HTMLInputElement, NumberInputProps>(
  ({ className, onMaxClick, ...props }, ref) => {
    return (
      <div className="relative">
        <input
          type="text"
          inputMode="decimal"
          className={cn(
            'flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50',
            className
          )}
          ref={ref}
          {...props}
        />
        {onMaxClick && (
          <button
            type="button"
            onClick={onMaxClick}
            className="absolute right-2 top-1/2 -translate-y-1/2 text-xs text-primary hover:underline"
          >
            MAX
          </button>
        )}
      </div>
    )
  }
)

NumberInput.displayName = 'NumberInput'

export default NumberInput

