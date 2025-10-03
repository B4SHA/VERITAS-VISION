"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { ShieldCheck, Moon, Sun } from "lucide-react";
import { useLanguage, languages } from "@/hooks/use-language";
import { cn } from "@/lib/utils";
import { Button } from "./ui/button";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "./ui/dropdown-menu";
import { useState, useEffect } from "react";

export function Header() {
  const pathname = usePathname();
  const { t, language, setLanguage } = useLanguage();
  const [isMounted, setIsMounted] = useState(false);

  // Use a state for theme and useEffect to avoid hydration mismatch
  const [theme, setTheme] = useState('dark');

  useEffect(() => {
    setIsMounted(true);
    // You can also add logic here to read theme from localStorage
  }, []);

  const toggleTheme = () => {
    setTheme(current => current === 'dark' ? 'light' : 'dark');
    // In a real app, you would also toggle a class on the `html` or `body` element
  }

  const menuItems = [
    { href: "/news", labelKey: "news_sleuth_nav" },
    { href: "/video", labelKey: "video_integrity_nav" },
    { href: "/audio", labelKey: "audio_authenticator_nav" },
    { href: "/image", labelKey: "image_verifier_nav" },
  ];

  if (!isMounted) {
    return (
        <header className="sticky top-0 z-50 w-full border-b border-border/40 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
            <div className="container flex h-16 max-w-screen-2xl items-center justify-between">
                <Link href="/" className="flex items-center gap-2">
                    <ShieldCheck className="h-6 w-6 text-primary" />
                    <span className="font-bold text-lg">Veritas Vision</span>
                </Link>
            </div>
        </header>
    )
  }

  return (
    <header className="sticky top-0 z-50 w-full border-b border-border/40 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container flex h-16 max-w-screen-2xl items-center justify-between">
        <Link href="/" className="flex items-center gap-2 mr-6">
            <ShieldCheck className="h-6 w-6 text-primary" />
            <span className="font-bold text-lg">Veritas Vision</span>
        </Link>
        
        <nav className="hidden md:flex items-center gap-6 text-sm">
          {menuItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "transition-colors hover:text-foreground/80",
                pathname === item.href ? "text-foreground" : "text-foreground/60"
              )}
            >
              {t(item.labelKey)}
            </Link>
          ))}
        </nav>

        <div className="flex flex-1 items-center justify-end gap-4">
            <DropdownMenu>
                <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="sm">
                        {language.toUpperCase()}
                        <span className="sr-only">Change language</span>
                    </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                    {languages.map((lang) => (
                        <DropdownMenuItem key={lang.value} onClick={() => setLanguage(lang.value)}>
                            {lang.label}
                        </DropdownMenuItem>
                    ))}
                </DropdownMenuContent>
            </DropdownMenu>

            <Button variant="ghost" size="icon" onClick={toggleTheme}>
              {theme === 'dark' ? <Sun className="h-[1.2rem] w-[1.2rem]" /> : <Moon className="h-[1.2rem] w-[1.2rem]" />}
              <span className="sr-only">Toggle theme</span>
            </Button>
        </div>
      </div>
    </header>
  );
}
