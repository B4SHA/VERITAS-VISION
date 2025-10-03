"use client"

import { languages, useLanguage } from "@/hooks/use-language";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Languages } from "lucide-react";

export function LanguageSwitcher() {
  const { language, setLanguage } = useLanguage();

  return (
    <div className="p-2">
      <Select value={language} onValueChange={(value) => setLanguage(value as any)}>
        <SelectTrigger className="h-8 bg-sidebar-background text-sidebar-foreground border-sidebar-border hover:bg-sidebar-accent focus:ring-sidebar-ring group-data-[collapsible=icon]:w-8 group-data-[collapsible=icon]:p-0 group-data-[collapsible=icon]:justify-center">
            <div className="flex items-center gap-2 group-data-[collapsible=icon]:hidden">
                <Languages className="size-4" />
                <SelectValue placeholder="Select language" />
            </div>
            <div className="hidden items-center gap-2 group-data-[collapsible=icon]:flex">
                <Languages className="size-4" />
            </div>
        </SelectTrigger>
        <SelectContent>
          {languages.map((lang) => (
            <SelectItem key={lang.value} value={lang.value}>
              {lang.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}
