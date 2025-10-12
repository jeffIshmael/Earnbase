import * as React from "react"
import { Slot } from "@radix-ui/react-slot"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@/lib/utils"

type Props = {
  title: string;
  onClick: () => void;
  widthFull?: boolean;
  disabled?: boolean;
  loading?: boolean;
  className?: string;
};

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-3 whitespace-nowrap font-inter font-heavy transition-all duration-200 focus-visible:outline-none focus-visible:ring-0 disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-5 [&_svg]:shrink-0",
  {
    variants: {
      variant: {
        default:
          "bg-celo-yellow text-black border-4 border-black hover:bg-black hover:text-celo-yellow",
        destructive:
          "bg-celo-error text-white border-4 border-black hover:bg-black hover:text-celo-error",
        outline:
          "border-4 border-black bg-white text-black hover:bg-celo-dk-tan hover:text-black",
        secondary:
          "bg-celo-purple text-white border-4 border-black hover:bg-black hover:text-celo-purple",
        forest:
          "bg-celo-forest text-white border-4 border-black hover:bg-black hover:text-celo-forest",
        ghost: "hover:bg-celo-dk-tan hover:text-black",
        link: "underline-offset-4 hover:underline text-celo-body",
      },
      size: {
        default: "h-12 px-6 py-3 text-body-m",
        sm: "h-10 px-4 py-2 text-body-s",
        lg: "h-14 px-8 py-4 text-body-l",
        icon: "h-12 w-12",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
)

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
  VariantProps<typeof buttonVariants> {
  asChild?: boolean;
  title: string;
  onClick: () => void;
  widthFull?: boolean;
  disabled?: boolean;
  loading?: boolean;
  className?: string;
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className,
    variant,
    size,
    asChild = false,
    title,
    onClick,
    widthFull = false,
    disabled,
    loading,
    ...props }, ref) => {
    const Comp = asChild ? Slot : "button"
    return (
      <Comp
        onClick={onClick}
        disabled={disabled ?? loading}
        className={cn(
          buttonVariants({ variant, size, className }),
          `${widthFull ? "w-full" : ""}`
        )}
        ref={ref}
        {...props}
      >
        {loading ? (
          <div className="flex items-center space-x-2">
            <div className="w-4 h-4 border-2 border-current border-t-transparent animate-spin"></div>
            <span>LOADING...</span>
          </div>
        ) : (
          title.toUpperCase()
        )}
      </Comp>
    )
  }
)
Button.displayName = "Button"

export { Button, buttonVariants }
