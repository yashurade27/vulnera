'use client'

import { useEffect, useMemo, useState } from 'react'
import { Menu, X, Shield, LogOut, User, LayoutDashboard } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useSession, signOut } from 'next-auth/react'
import dynamic from 'next/dynamic'
import { Button } from '@/components/ui/button'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { ThemeToggle } from '@/components/theme-toggle'
import { cn } from '@/lib/utils'
import { NotificationBell } from '@/components/notifications/notification-bell'

const WalletMultiButton = dynamic(
  () => import('@solana/wallet-adapter-react-ui').then((mod) => mod.WalletMultiButton),
  { ssr: false },
)

const ClusterDropdown = dynamic(() => import('@/components/cluster-dropdown').then((mod) => mod.ClusterDropdown), {
  ssr: false,
})

interface NavbarProps {
  showUtilityControls?: boolean
}

type NavItem = {
  id: string
  href: string
  label: string
}

export function Navbar({ showUtilityControls = false }: NavbarProps) {
  const pathname = usePathname()
  const { data: session, status } = useSession()
  const [isScrolled, setIsScrolled] = useState(false)
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 20)
    }
    window.addEventListener('scroll', handleScroll)
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  const isAuthenticated = status === 'authenticated'
  const user = session?.user

  const userInitials = useMemo(() => {
    if (!user) return 'U'
    const source = user.fullName || user.username || user.email || 'U'
    return source.charAt(0).toUpperCase()
  }, [user])

  const dashboardHref =
    user?.role === 'ADMIN' ? '/admin' : user?.role === 'COMPANY_ADMIN' ? '/dashboard/company' : '/dashboard/hunter'
  const dashboardLabel = user?.role === 'ADMIN' ? 'Admin' : 'Dashboard'
  const profileHref = user?.id ? `/profile/${user.id}` : '/profile'

  const handleMobileToggle = () => setIsMobileMenuOpen((prev) => !prev)
  const closeMobileMenu = () => setIsMobileMenuOpen(false)

  const handleSignOut = async () => {
    await signOut({ callbackUrl: '/' })
  }

  const navLinks = useMemo<NavItem[]>(() => {
    const baseLinks: NavItem[] = [
      { id: 'home', href: '/', label: 'Home' },
      { id: 'bounties', href: '/bounties', label: 'Bounties' },
      { id: 'leaderboard', href: '/leaderboard', label: 'Leaderboard' },
    ]

    if (!user) return baseLinks

    switch (user.role) {
      case 'ADMIN':
        return [
          { id: 'home', href: '/', label: 'Home' },
          { id: 'admin-dashboard', href: '/admin', label: 'Admin' },
          { id: 'admin-users', href: '/admin/users', label: 'Users' },
          { id: 'admin-companies', href: '/admin/companies', label: 'Companies' },
          { id: 'admin-reports', href: '/admin/reports', label: 'Reports' },
        ]
      case 'COMPANY_ADMIN':
        return [
          { id: 'home', href: '/', label: 'Home' },
          { id: 'company-dashboard', href: '/dashboard/company', label: 'Dashboard' },
          { id: 'company-bounties', href: '/dashboard/company/bounties', label: 'Bounties' },
          { id: 'company-submissions', href: '/dashboard/company/submissions', label: 'Submissions' },
          { id: 'company-settings', href: '/dashboard/company/settings', label: 'Settings' },
        ]
      case 'BOUNTY_HUNTER':
      default:
        return [
          { id: 'home', href: '/', label: 'Home' },
          { id: 'bounties', href: '/bounties', label: 'Bounties' },
          { id: 'hunter-dashboard', href: '/dashboard/hunter', label: 'Dashboard' },
          { id: 'leaderboard', href: '/leaderboard', label: 'Leaderboard' },
        ]
    }
  }, [user])

  const renderDesktopAuth = () => {
    if (status === 'loading') {
      return <div className="h-9 w-9 rounded-full bg-white/5 animate-pulse" aria-hidden />
    }
    if (isAuthenticated && user) {
      return (
        <>
          <NotificationBell userId={user.id} />
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button
                type="button"
                className="relative inline-flex items-center justify-center rounded-full ring-offset-background transition hover:ring-2 hover:ring-yellow-400/60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-yellow-400/70"
                aria-label="Account menu"
              >
                <Avatar className="h-9 w-9">
                  {user.avatarUrl ? (
                    <AvatarImage src={user.avatarUrl} alt={user.fullName ?? user.username ?? 'User'} />
                  ) : null}
                  <AvatarFallback className="bg-yellow-500/20 text-yellow-200 font-medium">
                    {userInitials}
                  </AvatarFallback>
                </Avatar>
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="min-w-48">
              <div className="px-3 py-2">
                <p className="text-sm font-semibold text-foreground">{user.fullName ?? user.username ?? user.email}</p>
                <p className="text-xs text-muted-foreground">{user.email}</p>
              </div>
              <DropdownMenuSeparator />
              <DropdownMenuItem asChild>
                <Link href={dashboardHref} className="flex items-center gap-2">
                  <LayoutDashboard className="h-4 w-4" /> {dashboardLabel}
                </Link>
              </DropdownMenuItem>
              <DropdownMenuItem asChild>
                <Link href={profileHref} className="flex items-center gap-2">
                  <User className="h-4 w-4" /> Profile
                </Link>
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={handleSignOut} className="text-red-400 focus:text-red-400">
                <LogOut className="mr-2 h-4 w-4" /> Sign out
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </>
      )
    }

    return (
      <>
        <Link href="/auth/login">
          <Button variant="outline">Login</Button>
        </Link>
        <Link href="/auth/register">
          <Button className="bg-gradient-to-r from-yellow-400 to-yellow-500 text-gray-900 hover:from-yellow-300 hover:to-yellow-400">
            Register
          </Button>
        </Link>
      </>
    )
  }

  return (
    <nav className={cn('nav-glass transition-shadow', isScrolled ? 'shadow-lg' : 'shadow-none')}>
      <div className="container-custom">
        <div className="flex items-center justify-between h-16">
          <Link
            href="/"
            className="flex items-center gap-2 hover:opacity-80 transition-opacity"
            onClick={closeMobileMenu}
          >
            <Shield className="w-8 h-8 text-yellow-400" />
            <span className="text-xl font-semibold">Vulnera</span>
          </Link>

          <div className="hidden md:flex items-center gap-8">
            {navLinks.map((item) => (
              <Link
                key={item.id}
                href={item.href}
                className={cn(
                  'link-premium transition-colors',
                  pathname === item.href || pathname.startsWith(`${item.href}/`) ? 'text-yellow-300' : '',
                )}
              >
                {item.label}
              </Link>
            ))}
          </div>

          <div className="hidden md:flex items-center gap-3">
            {showUtilityControls ? (
              <>
                <ThemeToggle />
                <ClusterDropdown />
                <WalletMultiButton />
              </>
            ) : null}
            {renderDesktopAuth()}
          </div>

          <div className="flex items-center gap-2 md:hidden">
            {isAuthenticated && user ? <NotificationBell userId={user.id} /> : null}
            <button
              className="p-2 hover:bg-muted rounded-lg transition-colors"
              onClick={handleMobileToggle}
              aria-label="Toggle menu"
            >
              {isMobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>
      </div>

      <AnimatePresence>
        {isMobileMenuOpen ? (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="md:hidden border-t border-white/10 bg-background/95 backdrop-blur-xl"
          >
            <div className="container-custom py-4 space-y-4">
              <div className="space-y-2">
                {navLinks.map((item) => (
                  <Link
                    key={item.id}
                    href={item.href}
                    className={cn(
                      'block link-premium py-2',
                      pathname === item.href || pathname.startsWith(`${item.href}/`) ? 'text-yellow-300' : '',
                    )}
                    onClick={closeMobileMenu}
                  >
                    {item.label}
                  </Link>
                ))}
              </div>

              {showUtilityControls ? (
                <div className="flex flex-wrap gap-3">
                  <ThemeToggle />
                  <ClusterDropdown />
                  <WalletMultiButton />
                </div>
              ) : null}

              {status === 'loading' ? (
                <div className="h-10 w-full rounded-xl bg-white/5 animate-pulse" aria-hidden />
              ) : isAuthenticated && user ? (
                <div className="space-y-3 rounded-xl border border-white/10 bg-white/5 p-4">
                  <div className="flex items-center gap-3">
                    <Avatar className="h-10 w-10">
                      {user.avatarUrl ? (
                        <AvatarImage src={user.avatarUrl} alt={user.fullName ?? user.username ?? 'User'} />
                      ) : null}
                      <AvatarFallback className="bg-yellow-500/20 text-yellow-200 font-medium">
                        {userInitials}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <p className="text-sm font-semibold">{user.fullName ?? user.username ?? user.email}</p>
                      <p className="text-xs text-muted-foreground">{user.email}</p>
                    </div>
                  </div>
                  <div className="flex flex-col gap-2 text-sm">
                    <Link href={dashboardHref} className="link-premium" onClick={closeMobileMenu}>
                      {dashboardLabel}
                    </Link>
                    <Link href="/notifications" className="link-premium" onClick={closeMobileMenu}>
                      Notifications
                    </Link>
                    <Link href={profileHref} className="link-premium" onClick={closeMobileMenu}>
                      Profile
                    </Link>
                    <button
                      type="button"
                      onClick={async () => {
                        closeMobileMenu()
                        await handleSignOut()
                      }}
                      className="inline-flex items-center gap-2 text-red-300 hover:text-red-200"
                    >
                      <LogOut className="h-4 w-4" /> Sign out
                    </button>
                  </div>
                </div>
              ) : (
                <div className="flex flex-col gap-3">
                  <Link href="/auth/login" onClick={closeMobileMenu}>
                    <Button className="w-full" variant="outline">
                      Login
                    </Button>
                  </Link>
                  <Link href="/auth/register" onClick={closeMobileMenu}>
                    <Button className="w-full bg-gradient-to-r from-yellow-400 to-yellow-500 text-gray-900 hover:from-yellow-300 hover:to-yellow-400">
                      Register
                    </Button>
                  </Link>
                </div>
              )}
            </div>
          </motion.div>
        ) : null}
      </AnimatePresence>
    </nav>
  )
}
