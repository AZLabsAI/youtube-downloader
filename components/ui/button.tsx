"use client"

import * as React from "react"
import { Slot } from "@radix-ui/react-slot"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@/lib/utils"

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap text-sm font-bold ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0 relative overflow-hidden",
  {
    variants: {
      variant: {
        default: "liquid-glass-button rounded-liquid-xl text-gray-900 dark:text-white liquid-light-source",
        destructive:
          "liquid-glass-button rounded-liquid-xl text-red-700 dark:text-red-300 border-red-500/30",
        outline:
          "liquid-glass rounded-liquid-lg border-2 text-gray-900 dark:text-white liquid-interactive",
        secondary:
          "liquid-glass rounded-liquid-lg text-gray-700 dark:text-gray-300",
        ghost: "hover:liquid-glass-clear rounded-liquid text-gray-900 dark:text-white transition-all duration-300",
        link: "text-primary underline-offset-4 hover:underline",
      },
      size: {
        default: "h-11 px-5 py-2.5",
        sm: "h-9 rounded-liquid px-4 text-xs",
        lg: "h-14 rounded-liquid-xl px-10 text-base",
        icon: "h-11 w-11 rounded-liquid",
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
  asChild?: boolean
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, onClick, ...props }, ref) => {
    const Comp = asChild ? Slot : "button"
    const [ripples, setRipples] = React.useState<{ x: number; y: number; id: number }[]>([])
    
    const handleClick = (e: React.MouseEvent<HTMLButtonElement>) => {
      // Create ripple effect
      if (!asChild) {
        const button = e.currentTarget
        const rect = button.getBoundingClientRect()
        const x = e.clientX - rect.left
        const y = e.clientY - rect.top
        const id = Date.now()
        
        setRipples(prev => [...prev, { x, y, id }])
        
        // Remove ripple after animation
        setTimeout(() => {
          setRipples(prev => prev.filter(ripple => ripple.id !== id))
        }, 1000)
      }
      
      onClick?.(e)
    }
    
    return (
      <Comp
        className={cn(buttonVariants({ variant, size, className }))}
        ref={ref}
        onClick={handleClick}
        {...props}
      >
        {props.children}
        {ripples.map(ripple => (
          <span
            key={ripple.id}
            className="absolute rounded-full bg-white/40 dark:bg-white/30 pointer-events-none animate-liquid-ripple"
            style={{
              left: ripple.x,
              top: ripple.y,
              width: 0,
              height: 0,
            }}
          />
        ))}
      </Comp>
    )
  }
)
Button.displayName = "Button"

export { Button, buttonVariants }
