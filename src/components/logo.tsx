"use client";

import { useLanguage } from "@/hooks/use-language";
import { ShieldCheck } from "lucide-react";

export function Logo({ full = false }: { full?: boolean }) {
  const { t } = useLanguage();
  return (
    <div className="flex items-center gap-2" aria-label="Veritas Vision Logo">
      <ShieldCheck className="h-6 w-6 text-primary" />
      <span className="font-bold text-lg">
        {full ? t('app_title_long') : t('app_title_short')}
      </span>
    </div>
  );
}
