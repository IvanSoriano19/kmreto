import { forwardRef } from 'react'
import * as DialogPrimitive from '@radix-ui/react-dialog'
import { X } from 'lucide-react'
import { cn } from '@/lib/utils'

const Sheet = DialogPrimitive.Root
const SheetTrigger = DialogPrimitive.Trigger
const SheetClose = DialogPrimitive.Close
const SheetPortal = DialogPrimitive.Portal

const SheetOverlay = forwardRef(({ className, ...props }, ref) => (
  <DialogPrimitive.Overlay
    ref={ref}
    className={cn(
      'fixed inset-0 z-50 bg-black/35 data-[state=open]:animate-fade-in data-[state=closed]:animate-fade-out',
      className
    )}
    {...props}
  />
))
SheetOverlay.displayName = DialogPrimitive.Overlay.displayName

// Hoja modal que sube desde abajo — misma forma que "Nueva actividad" en el boceto:
// esquinas superiores de 26px, tirador central, hasta el 92% de la pantalla.
const SheetContent = forwardRef(({ className, children, ...props }, ref) => (
  <SheetPortal>
    <SheetOverlay />
    <DialogPrimitive.Content
      ref={ref}
      className={cn(
        'fixed inset-x-0 bottom-0 z-50 mx-auto flex max-h-[92vh] w-full max-w-2xl flex-col overflow-y-auto rounded-t-[26px] bg-k-bg shadow-[0_-1px_0_var(--k-sep)] focus:outline-none',
        'data-[state=open]:animate-sheet-up data-[state=closed]:animate-sheet-down',
        className
      )}
      {...props}
    >
      <div className="flex justify-center pt-2.5">
        <div className="h-[5px] w-[38px] rounded-full bg-k-text3" />
      </div>
      {children}
    </DialogPrimitive.Content>
  </SheetPortal>
))
SheetContent.displayName = DialogPrimitive.Content.displayName

function SheetHeader({ className, children, ...props }) {
  return (
    <div className={cn('flex items-center justify-between px-5 pb-2 pt-3.5', className)} {...props}>
      {children}
    </div>
  )
}

const SheetTitle = forwardRef(({ className, ...props }, ref) => (
  <DialogPrimitive.Title
    ref={ref}
    className={cn('text-[20px] font-semibold tracking-[-0.02em] text-k-text', className)}
    {...props}
  />
))
SheetTitle.displayName = DialogPrimitive.Title.displayName

function SheetCloseButton({ className, ...props }) {
  return (
    <DialogPrimitive.Close
      className={cn(
        'flex h-[30px] w-[30px] flex-none items-center justify-center rounded-full bg-k-fill text-k-text2',
        className
      )}
      {...props}
    >
      <X className="h-[15px] w-[15px]" strokeWidth={2.2} />
      <span className="sr-only">Cerrar</span>
    </DialogPrimitive.Close>
  )
}

export { Sheet, SheetTrigger, SheetClose, SheetContent, SheetHeader, SheetTitle, SheetCloseButton }
