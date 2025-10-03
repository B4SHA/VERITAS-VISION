"use client";

import { useLanguage } from "@/hooks/use-language";

export function Logo({ full = false }: { full?: boolean }) {
  const { t } = useLanguage();
  return (
    <div className="flex items-center gap-2" aria-label="Veritas Vision Logo">
      <svg
        width="32"
        height="32"
        viewBox="0 0 24 24"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className="text-sidebar-foreground"
      >
        <path
          d="M12 2L2 7V17L12 22L22 17V7L12 2Z"
          stroke="currentColor"
          strokeWidth="1.5"
          strokeLinejoin="round"
        />
        <path
          d="M16.5 9.5L12 18L7.5 9.5"
          stroke="currentColor"
          strokeWidth="1.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
      <span className="text-xl font-bold font-headline text-sidebar-foreground group-data-[collapsible=icon]:hidden">
        {full ? t('app_title_long') : t('app_title_short')}
      </span>
    </div>
  );
}
