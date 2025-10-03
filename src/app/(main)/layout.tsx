'use client';

import { MainNav } from '@/components/main-nav';
import { PageHeader } from '@/components/page-header';
import { LanguageSwitcher } from '@/components/language-switcher';
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarInset,
} from '@/components/ui/sidebar';
import { Icons } from '@/components/icons';

export default function MainLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <>
      <Sidebar collapsible="icon">
        <SidebarHeader>
          <Icons.shield className="h-8 w-8 text-primary" />
        </SidebarHeader>
        <SidebarContent>
          <MainNav />
        </SidebarContent>
        <SidebarFooter>
          <LanguageSwitcher />
        </SidebarFooter>
      </Sidebar>
      <SidebarInset>
        <PageHeader />
        <main className="flex-1 p-4 sm:p-6 lg:p-8">
            {children}
        </main>
      </SidebarInset>
    </>
  );
}
