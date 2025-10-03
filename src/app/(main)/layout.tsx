import {
    Sidebar,
    SidebarContent,
    SidebarFooter,
    SidebarHeader,
    SidebarInset,
    SidebarProvider,
  } from "@/components/ui/sidebar";
import { MainNav } from "@/components/main-nav";
import { PageHeader } from "@/components/page-header";
import { Logo } from "@/components/logo";
import { LanguageSwitcher } from "@/components/language-switcher";
  
export default function MainLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return (
        <SidebarProvider>
            <Sidebar collapsible="icon">
                <SidebarHeader>
                    <Logo />
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
                <main className="flex-1 p-4 sm:p-6 lg:p-8 h-[calc(100vh-4rem)]">
                    {children}
                </main>
            </SidebarInset>
        </SidebarProvider>
    );
}
