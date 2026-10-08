import { Button as ButtonPrimitive } from "@base-ui/react/button";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const buttonVariants = cva(
  "group/button inline-flex shrink-0 items-center justify-center rounded-xl border border-transparent bg-clip-padding text-xs font-medium whitespace-nowrap transition-all duration-150 outline-none select-none focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/50 focus-visible:ring-offset-2 focus-visible:ring-offset-background disabled:pointer-events-none disabled:opacity-40 aria-invalid:border-destructive aria-invalid:ring-2 aria-invalid:ring-destructive/20 [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4",
  {
    variants: {
      variant: {
        default:
          "bg-primary text-primary-foreground hover:bg-primary/90 shadow-xs shadow-primary/25 active:scale-[0.985]",
        outline:
          "border-border/80 bg-card/60 hover:bg-secondary/70 hover:text-foreground text-foreground shadow-xs active:scale-[0.985]",
        secondary:
          "bg-secondary/80 text-secondary-foreground hover:bg-secondary active:scale-[0.985]",
        ghost:
          "text-muted-foreground hover:bg-secondary/60 hover:text-foreground active:scale-[0.985]",
        destructive:
          "bg-destructive/15 text-destructive border border-destructive/20 hover:bg-destructive/25 active:scale-[0.985]",
        link: "text-primary underline-offset-4 hover:underline p-0 h-auto font-normal",
        tech: "border border-border/70 bg-card/40 font-mono text-[11px] text-muted-foreground hover:bg-secondary hover:text-foreground active:scale-[0.985]",
      },
      size: {
        default:
          "h-9.5 min-h-[38px] gap-2 px-3.5 text-xs has-data-[icon=inline-end]:pr-2.5 has-data-[icon=inline-start]:pl-2.5",
        xs: "h-7 gap-1 rounded-lg px-2 text-[11px]",
        sm: "h-8 gap-1.5 rounded-lg px-2.5 text-xs font-medium",
        lg: "h-11 min-h-[44px] gap-2 rounded-xl px-5 text-sm font-semibold tracking-wide",
        icon: "size-9.5 min-h-[38px] min-w-[38px] rounded-xl",
        "icon-xs": "size-7 rounded-lg [&_svg:not([class*='size-'])]:size-3",
        "icon-sm": "size-8 rounded-lg",
        "icon-lg": "size-11 min-h-[44px] min-w-[44px] rounded-xl",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  },
);

function Button({
  className,
  variant = "default",
  size = "default",
  ...props
}: ButtonPrimitive.Props & VariantProps<typeof buttonVariants>) {
  return (
    <ButtonPrimitive
      data-slot="button"
      className={cn(buttonVariants({ variant, size, className }))}
      {...props}
    />
  );
}

export { Button, buttonVariants };
