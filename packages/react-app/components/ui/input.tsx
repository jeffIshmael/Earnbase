import * as React from "react"

import { cn } from "@/lib/utils"

export interface InputProps
  extends React.InputHTMLAttributes<HTMLInputElement> {}

const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, type, ...props }, ref) => {
    return (
      <input
        type={type}
        className={cn(
          "flex h-12 w-full border-4 border-black bg-white px-4 py-3 mb-4 text-body-m font-inter text-black transition-all duration-200 file:border-0 file:bg-transparent file:text-body-m file:font-inter file:text-black placeholder:text-celo-body focus-visible:outline-none focus-visible:ring-0 focus-visible:border-celo-yellow disabled:cursor-not-allowed disabled:opacity-50",
          className
        )}
        ref={ref}
        {...props}
      />
    )
  }
)
Input.displayName = "Input"

export { Input }
