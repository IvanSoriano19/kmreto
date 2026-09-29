import { forwardRef } from 'react'
import { Slot } from '@radix-ui/react-slot'
import { cva } from 'class-variance-authority'
import { cn } from '@/lib/utils'

const buttonVariants = cva(
  'inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-2xl text-sm font-semibold transition-colors disabled:pointer-events-none disabled:opacity-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-k-accent focus-visible:ring-offset-2 focus-visible:ring-offset-k-bg',
  {
    variants: {
      variant: {
        default: 'bg-k-accent text-k-accent-foreground hover:brightness-105 active:brightness-95',
        outline: 'border border-k-sep bg-transparent text-k-text hover:bg-k-fill',
        ghost: 'bg-transparent text-k-text hover:bg-k-fill',
        link: 'bg-transparent text-k-accent-ink font-medium p-0 h-auto rounded-none hover:underline',
        destructive: 'bg-transparent text-k-danger hover:bg-k-fill',
        soft: 'bg-k-accent-soft text-k-accent-ink hover:brightness-95',
      },
      size: {
        default: 'h-12 px-5 text-[15px]',
        sm: 'h-9 px-3.5 text-[13px] rounded-full',
        lg: 'h-[52px] px-5 text-[16px]',
        icon: 'h-9 w-9 rounded-full',
      },
    },
    defaultVariants: {
      variant: 'default',
      size: 'default',
    },
  }
)

const Button = forwardRef(({ className, variant, size, asChild = false, ...props }, ref) => {
  const Comp = asChild ? Slot : 'button'
  return (
    <Comp className={cn(buttonVariants({ variant, size, className }))} ref={ref} {...props} />
  )
})
Button.displayName = 'Button'

export { Button, buttonVariants }
