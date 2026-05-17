import React from 'react'
import { useThemeClass } from '../../hooks/useThemeClass'
import { TopNavbar } from './TopNavbar'

export function AppLayout({ children }: { children: React.ReactNode }) {
  const themeClass = useThemeClass()

  return (
    <div className={themeClass + ' min-h-screen bg-gray-50 text-gray-900'}>
      <TopNavbar />
      <div className="container mx-auto px-4 py-6">{children}</div>
    </div>
  )
}

