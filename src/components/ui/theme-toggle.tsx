'use client'

import { Sun, Moon, Monitor } from 'lucide-react'
import { Button } from './button'
import { useTheme } from '@/hooks/use-theme'
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
} from './dropdown-menu'
import { cn } from '@/lib/utils'

export function ThemeToggle() {
  const { theme, resolvedTheme, setTheme } = useTheme()

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" className="relative">
          <Sun className={cn(
            'h-4 w-4 transition-all',
            resolvedTheme === 'dark' ? 'scale-0 rotate-90' : 'scale-100 rotate-0'
          )} />
          <Moon className={cn(
            'absolute h-4 w-4 transition-all',
            resolvedTheme === 'dark' ? 'scale-100 rotate-0' : 'scale-0 -rotate-90'
          )} />
          <span className="sr-only">Toggle theme</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuItem
          onClick={() => setTheme('light')}
          className={cn(theme === 'light' && 'bg-accent-subtle')}
        >
          <Sun className="mr-2 h-4 w-4" />
          Light
        </DropdownMenuItem>
        <DropdownMenuItem
          onClick={() => setTheme('dark')}
          className={cn(theme === 'dark' && 'bg-accent-subtle')}
        >
          <Moon className="mr-2 h-4 w-4" />
          Dark
        </DropdownMenuItem>
        <DropdownMenuItem
          onClick={() => setTheme('system')}
          className={cn(theme === 'system' && 'bg-accent-subtle')}
        >
          <Monitor className="mr-2 h-4 w-4" />
          System
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}

export function ThemeToggleSimple() {
  const { resolvedTheme, toggleTheme } = useTheme()

  return (
    <Button variant="ghost" size="icon" onClick={toggleTheme}>
      <Sun className={cn(
        'h-4 w-4 transition-all',
        resolvedTheme === 'dark' ? 'scale-0 rotate-90' : 'scale-100 rotate-0'
      )} />
      <Moon className={cn(
        'absolute h-4 w-4 transition-all',
        resolvedTheme === 'dark' ? 'scale-100 rotate-0' : 'scale-0 -rotate-90'
      )} />
      <span className="sr-only">Toggle theme</span>
    </Button>
  )
}
