import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@/lib/utils"

const badgeVariants = cva(
  "inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2",
  {
    variants: {
      variant: {
        default: "border-transparent bg-brand-100 text-brand-700 hover:bg-brand-200",
        secondary: "border-transparent bg-cream-200 text-ink-700 hover:bg-cream-300",
        destructive: "border-transparent bg-rose-100 text-rose-500 hover:bg-rose-100/70",
        outline: "border-cream-300 text-ink-700",
        sage: "border-transparent bg-brand-100 text-brand-700",
        amber: "border-transparent bg-amber-100 text-amber-500",
        chip: "border-transparent bg-cream-100 text-ink-700 px-3 py-1 text-xs",
        chipActive: "border-transparent bg-brand text-white px-3 py-1 text-xs",
        chipBrand: "border-transparent bg-brand-100 text-brand-700 px-3 py-1 text-xs",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
)

export interface BadgeProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof badgeVariants> {}

function Badge({ className, variant, ...props }: BadgeProps) {
  return (
    <div className={cn(badgeVariants({ variant }), className)} {...props} />
  )
}

export { Badge, badgeVariants }
