import * as React from "react";
import { cn } from "@/lib/utils";

function Textarea({ className, ...props }: React.ComponentProps<"textarea">) {
  return (
    <textarea
      data-slot="textarea"
      className={cn(
        "flex field-sizing-content min-h-20 w-full rounded-xl border border-border/80 bg-card/50 px-3.5 py-2.5 text-sm text-foreground transition-all duration-150 outline-none placeholder:text-muted-foreground/60 focus-visible:border-primary focus-visible:ring-2 focus-visible:ring-primary/25 focus-visible:bg-card/80 disabled:cursor-not-allowed disabled:bg-card/30 disabled:opacity-50 aria-invalid:border-destructive aria-invalid:ring-2 aria-invalid:ring-destructive/20 font-sans resize-y",
        className,
      )}
      {...props}
    />
  );
}

export { Textarea };
