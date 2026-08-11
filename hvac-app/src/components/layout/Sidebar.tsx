'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import {
  Building2,
  Wrench,
  ClipboardList,
  FileText,
  Settings,
  LayoutDashboard,
  Users,
  LogOut,
  Package,
  Truck,
  Lightbulb,
  Receipt,
  ShoppingCart,
} from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'

const navItems = [
  { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/facilities', label: 'Facilities', icon: Building2 },
  { href: '/maintenance/new', label: 'Start Maintenance', icon: Wrench },
  { href: '/recommendations', label: 'Recommendations', icon: Lightbulb },
  { href: '/quotes', label: 'Quotes', icon: Receipt },
  { href: '/procurement', label: 'Parts Pre-Orders', icon: Package },
  { href: '/orders', label: 'Client Parts Orders', icon: ShoppingCart },
  { href: '/parts', label: 'Parts Catalog', icon: ClipboardList, adminOnly: true },
  { href: '/suppliers', label: 'Suppliers', icon: Truck, adminOnly: true },
  { href: '/reports', label: 'Reports', icon: FileText },
  { href: '/settings', label: 'Settings', icon: Settings, adminOnly: true },
]

import { useEffect, useState } from 'react'

export default function Sidebar() {
  const pathname = usePathname()
  const router = useRouter()
  const supabase = createClient()
  const [role, setRole] = useState<string | null>(null)

  useEffect(() => {
    supabase.auth.getUser().then(async ({ data: { user } }) => {
      if (!user) return
      const { data } = await supabase.from('users').select('role').eq('id', user.id).single()
      setRole(data?.role ?? null)
    })
  }, [])

  const visibleItems = navItems.filter((item) => !item.adminOnly || ['company_admin', 'super_admin'].includes(role ?? ''))

  async function handleSignOut() {
    await supabase.auth.signOut()
    router.push('/auth/login')
  }

  return (
    <aside className="w-64 bg-[#193140] min-h-screen flex flex-col">
      {/* Logo */}
      <div className="p-6 border-b border-white/10">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 bg-white rounded-lg flex items-center justify-center flex-shrink-0">
            <Wrench className="w-5 h-5 text-[#193140]" />
          </div>
          <div>
            <p className="text-white font-bold text-sm leading-tight">HVAC Maintenance</p>
            <p className="text-blue-300 text-xs">Manager</p>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 p-4 space-y-1">
        {visibleItems.map(({ href, label, icon: Icon }) => {
          const active = pathname === href || pathname.startsWith(href + '/')
          return (
            <Link
              key={href}
              href={href}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                active
                  ? 'bg-white/15 text-white'
                  : 'text-blue-100 hover:bg-white/10 hover:text-white'
              }`}
            >
              <Icon className="w-4 h-4 flex-shrink-0" />
              {label}
            </Link>
          )
        })}
      </nav>

      {/* Sign out */}
      <div className="p-4 border-t border-white/10">
        <button
          onClick={handleSignOut}
          className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-blue-200 hover:bg-white/10 hover:text-white transition-colors w-full"
        >
          <LogOut className="w-4 h-4" />
          Sign Out
        </button>
      </div>
    </aside>
  )
}
