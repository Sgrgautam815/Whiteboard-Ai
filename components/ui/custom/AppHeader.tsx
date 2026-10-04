import React from 'react'
import { SidebarTrigger } from '../sidebar'
import { UserButton } from '@clerk/nextjs'
import { ThemeSwitcher } from './ThemeSwitcher'

function AppHeader() {
  return (
    <div className="w-full border-b border-slate-200 bg-white/80 px-4 py-3 flex items-center justify-between shadow-xs backdrop-blur dark:border-slate-800 dark:bg-slate-900/80">
      <SidebarTrigger />
      <div className="flex items-center gap-3">
        <ThemeSwitcher />
        <UserButton />
      </div>
    </div>
  )
}

export default AppHeader
