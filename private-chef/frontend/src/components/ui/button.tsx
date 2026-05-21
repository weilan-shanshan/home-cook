import * as React from "react"
import { Slot } from "@radix-ui/react-slot"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@/lib/utils"

const buttonVariants = cva(
  "inline-flex items-center justify-center whitespace-nowrap rounded-full text-sm font-medium ring-offset-background transition-all duration-150 active:scale-[0.97] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 cursor-pointer",
  {
    variants: {
      variant: {
        default: "bg-brand text-white shadow-button hover:brightness-105 active:brightness-95",
        destructive: "bg-rose-500 text-white shadow-button hover:brightness-105",
        outline: "border border-cream-300 bg-white/60 backdrop-blur-md text-ink-900 hover:bg-white/80 hover:border-cream-400",
        secondary: "bg-cream-100/80 backdrop-blur-md text-ink-900 border border-cream-200 hover:bg-cream-200/80",
        ghost: "text-ink-700 hover:bg-cream-100/60",
        link: "text-brand underline-offset-4 hover:underline",
        inverse: "bg-brand-700 text-cream-50 shadow-button-inverse hover:bg-brand-600 active:bg-brand-700",
      },
      size: {
        default: "h-11 px-6 py-2",
        sm: "h-9 px-4 text-xs",
        lg: "h-12 px-8 text-base",
        pill: "h-14 px-8 text-base font-medium rounded-full",
        icon: "h-11 w-11",
        iconSm: "h-9 w-9",
      },
    },
    defaultVariants: { variant: "default", size: "default" },
  }
)

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : "button"
    return (
      <Comp
        className={cn(buttonVariants({ variant, size, className }))}
        ref={ref}
        {...props}
      />
    )
  }
)
Button.displayName = "Button"

export { Button, buttonVariants }
