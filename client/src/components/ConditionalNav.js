'use client'

import { usePathname } from 'next/navigation'
import FloatingDockNav from '@/components/home/floating-dock-nav'

export default function ConditionalNav() {
  const pathname = usePathname()
  
  // Don't show navigation on auth, account, and reports pages
  if (pathname?.startsWith('/auth') || pathname?.startsWith('/account') || pathname?.startsWith('/reports')) {
    return null
  }
  
  return <FloatingDockNav />
}
