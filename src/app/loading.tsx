import { Icons } from "@/components/icons";

export default function Loading() {
  return (
    <div className="flex-1 flex items-center justify-center">
      <div className="flex flex-col items-center gap-4">
        <Icons.shield className="h-24 w-24 text-primary animate-shield-pulse" />
        <p className="text-muted-foreground mt-4 text-lg">Loading Veritas Vision...</p>
      </div>
    </div>
  );
}
