import { Link, useLocation } from 'react-router-dom'
import { ConnectButton } from '@rainbow-me/rainbowkit'
import { Wallet, Home, Lock, CreditCard, Sprout, FileText, Settings } from 'lucide-react'
import { cn } from '@/lib/utils'

interface LayoutProps {
  children: React.ReactNode
}

const navItems = [
  { path: '/', label: 'Dashboard', icon: Home },
  { path: '/vault', label: 'Vault', icon: Lock },
  { path: '/borrow', label: 'Borrow', icon: CreditCard },
  { path: '/harvest', label: 'Harvest', icon: Sprout },
  { path: '/positions', label: 'Positions', icon: Wallet },
  { path: '/docs', label: 'Docs', icon: FileText },
  { path: '/admin', label: 'Admin', icon: Settings },
]

export default function Layout({ children }: LayoutProps) {
  const location = useLocation()

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-8">
            <Link to="/" className="text-2xl font-bold text-primary">
              Autonomy Finance
            </Link>
            <nav className="hidden md:flex gap-1">
              {navItems.map((item) => {
                const Icon = item.icon
                const isActive = location.pathname === item.path
                return (
                  <Link
                    key={item.path}
                    to={item.path}
                    className={cn(
                      'flex items-center gap-2 px-4 py-2 rounded-md transition-colors',
                      isActive
                        ? 'bg-primary text-primary-foreground'
                        : 'text-muted-foreground hover:text-foreground hover:bg-accent'
                    )}
                  >
                    <Icon className="w-4 h-4" />
                    {item.label}
                  </Link>
                )
              })}
            </nav>
          </div>
          <ConnectButton />
        </div>
      </header>
      <main className="container mx-auto px-4 py-8">{children}</main>
    </div>
  )
}

