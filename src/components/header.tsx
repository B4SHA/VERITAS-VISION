
'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Icons } from '@/components/icons';
import { cn } from '@/lib/utils';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';
import { Button } from './ui/button';
import { Menu, Languages } from 'lucide-react';
import { ThemeToggle } from './theme-toggle';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { useLanguage } from '@/context/language-context';
import { useTranslation } from '@/hooks/use-translation';


export function Header() {
  const pathname = usePathname();
  const { setLanguage } = useLanguage();
  const { t, navigationLinks } = useTranslation();

  return (
    <header className="sticky top-0 z-40 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container flex h-16 items-center justify-between">
        <Link href="/" className="flex items-center space-x-2">
          <Icons.shield className="h-8 w-8 text-primary" />
          <span className="text-xl font-bold tracking-tight text-foreground">
            Misinformation Mitigator
          </span>
        </Link>
        
        <div className="flex items-center gap-2">
          {/* Desktop Navigation */}
          <nav className="hidden md:flex gap-6">
            {navigationLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className={cn(
                  'text-sm font-medium transition-colors hover:text-primary',
                  pathname === link.href ? 'text-primary' : 'text-muted-foreground'
                )}
              >
                {link.name}
              </Link>
            ))}
          </nav>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon">
                <Languages className="h-[1.2rem] w-[1.2rem]" />
                <span className="sr-only">Change language</span>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => setLanguage('en')}>
                English
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => setLanguage('hi')}>
                Hindi (हिन्दी)
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => setLanguage('bn')}>
                Bengali (বাংলা)
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => setLanguage('mr')}>
                Marathi (मराठी)
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => setLanguage('te')}>
                Telugu (తెలుగు)
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => setLanguage('ta')}>
                Tamil (தமிழ்)
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
          
          <ThemeToggle />

          {/* Mobile Navigation */}
          <div className="md:hidden">
            <Sheet>
              <SheetTrigger asChild>
                <Button variant="ghost" size="icon">
                  <Menu className="h-6 w-6" />
                  <span className="sr-only">Toggle Menu</span>
                </Button>
              </SheetTrigger>
              <SheetContent side="right">
                <Link href="/" className="flex items-center space-x-2 mb-6">
                  <Icons.shield className="h-8 w-8 text-primary" />
                  <span className="text-xl font-bold tracking-tight text-foreground">
                    Misinformation Mitigator
                  </span>
                </Link>
                <div className="grid gap-4 py-2">
                  {navigationLinks.map((link) => (
                    <Link
                      key={link.href}
                      href={link.href}
                      className={cn(
                        'flex items-center space-x-2 rounded-md p-2 text-lg font-medium',
                        pathname === link.href ? 'bg-accent text-accent-foreground' : 'hover:bg-accent/80'
                      )}
                    >
                      {link.name}
                    </Link>
                  ))}
                </div>
              </SheetContent>
            </Sheet>
          </div>
        </div>
      </div>
    </header>
  );
}
