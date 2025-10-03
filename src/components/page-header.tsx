"use client";

import { usePathname } from "next/navigation";
import { SidebarTrigger } from "@/components/ui/sidebar";
import { useLanguage } from "@/hooks/use-language";

export function PageHeader() {
  const pathname = usePathname();
  const { t } = useLanguage();

  const getTitle = () => {
    if (pathname === "/video") return t("video_integrity_title");
    if (pathname === "/audio") return t("audio_authenticator_title");
    if (pathname === "/image") return t("image_verifier_title");
    if (pathname === "/news") return t("news_sleuth_title");
    return t("app_title_long");
  };

  return (
    <header className="sticky top-0 z-10 flex h-16 items-center gap-4 border-b bg-background/80 px-4 backdrop-blur-sm sm:px-6">
      <SidebarTrigger className="md:hidden" />
      <h1 className="text-xl font-semibold tracking-tight font-headline">{getTitle()}</h1>
    </header>
  );
}
