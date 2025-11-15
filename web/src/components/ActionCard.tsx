import { ReactNode } from 'react'
import { cn } from '@/lib/utils'

interface ActionCardProps {
  title: string
  description?: string
  children: ReactNode
  className?: string
}

export default function ActionCard({ title, description, children, className }: ActionCardProps) {
  return (
    <div className={cn('rounded-lg border border-border bg-card p-6', className)}>
      <div className="mb-6">
        <h2 className="text-2xl font-bold mb-2">{title}</h2>
        {description && <p className="text-muted-foreground">{description}</p>}
      </div>
      {children}
    </div>
  )
}

