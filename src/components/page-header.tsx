"use client";

import { usePathname } from "next/navigation";
import { SidebarTrigger } from "@/components/ui/sidebar";
import { useLanguage } from "@/hooks/use-language";

export function PageHeader() {
  const pathname = usePathname();
  const { t } = useLanguage();

  const getTitle = () => {
    if (pathname.includes("/video")) return t("video_integrity_nav");
    if (pathname.includes("/audio")) return t("audio_authenticator_nav");
    if (pathname.includes("/image")) return t("image_verifier_nav");
    if (pathname.includes("/news")) return t("news_sleuth_nav");
    return t("app_title_long");
  };
  
  const isVideoPage = pathname.includes("/video");

  return (
    <header className="sticky top-0 z-10 flex h-16 items-center gap-4 border-b bg-transparent px-4 backdrop-blur-sm sm:px-6">
      <SidebarTrigger className="md:hidden" />
      {!isVideoPage && <h1 className="text-xl font-semibold tracking-tight font-headline">{getTitle()}</h1>}
    </header>
  );
}
