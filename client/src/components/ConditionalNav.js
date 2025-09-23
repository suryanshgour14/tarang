'use client'

import { usePathname } from 'next/navigation'
import FloatingNav from '@/components/home/floating-nav'

export default function ConditionalNav() {
  const pathname = usePathname()
  
  // Don't show navigation on auth and account pages
  if (pathname?.startsWith('/auth') || pathname?.startsWith('/account')) {
    return null
  }
  
  return <FloatingNav />
}
