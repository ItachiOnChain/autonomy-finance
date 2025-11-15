import { LucideIcon } from 'lucide-react'
import { cn } from '@/lib/utils'

interface StatCardProps {
  title: string
  value: string
  subtitle?: string
  icon?: LucideIcon
  variant?: 'default' | 'success' | 'warning' | 'danger'
}

export default function StatCard({
  title,
  value,
  subtitle,
  icon: Icon,
  variant = 'default',
}: StatCardProps) {
  const variants = {
    default: 'border-border',
    success: 'border-green-500/50 bg-green-500/5',
    warning: 'border-yellow-500/50 bg-yellow-500/5',
    danger: 'border-red-500/50 bg-red-500/5',
  }

  return (
    <div className={cn('rounded-lg border p-6', variants[variant])}>
      <div className="flex items-center justify-between mb-2">
        <p className="text-sm font-medium text-muted-foreground">{title}</p>
        {Icon && <Icon className="w-4 h-4 text-muted-foreground" />}
      </div>
      <p className="text-2xl font-bold">{value}</p>
      {subtitle && <p className="text-sm text-muted-foreground mt-1">{subtitle}</p>}
    </div>
  )
}

