'use client';
import { SidebarTrigger } from '@/components/ui/sidebar';
import { ThemeToggle } from './theme-toggle';

export function PageHeader() {
  return (
    <header
      data-sidebar="header"
      className="sticky top-0 z-30 flex h-14 items-center justify-between gap-4 border-b bg-background/95 px-4 backdrop-blur supports-[backdrop-filter]:bg-background/60 sm:px-6"
    >
      <SidebarTrigger />
      <div className="flex items-center gap-2">
        <ThemeToggle />
      </div>
    </header>
  );
}
