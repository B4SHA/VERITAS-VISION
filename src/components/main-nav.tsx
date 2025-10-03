"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Newspaper, Film, AudioLines, Image as ImageIcon } from "lucide-react";
import {
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
} from "@/components/ui/sidebar";
import { useLanguage } from "@/hooks/use-language";

export function MainNav() {
  const pathname = usePathname();
  const { t } = useLanguage();

  const menuItems = [
    { href: "/news", labelKey: "news_sleuth_nav", icon: Newspaper },
    { href: "/video", labelKey: "video_integrity_nav", icon: Film },
    { href: "/audio", labelKey: "audio_authenticator_nav", icon: AudioLines },
    { href: "/image", labelKey: "image_verifier_nav", icon: ImageIcon },
  ];

  return (
    <SidebarMenu>
      {menuItems.map((item) => (
        <SidebarMenuItem key={item.href}>
          <SidebarMenuButton
            asChild
            isActive={pathname === item.href}
            tooltip={{
              children: t(item.labelKey),
              className: "bg-primary text-primary-foreground",
            }}
          >
            <Link href={item.href}>
              <item.icon />
              <span>{t(item.labelKey)}</span>
            </Link>
          </SidebarMenuButton>
        </SidebarMenuItem>
      ))}
    </SidebarMenu>
  );
}
