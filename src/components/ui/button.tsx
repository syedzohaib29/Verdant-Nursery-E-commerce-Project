import { Button as ButtonPrimitive } from "@base-ui/react/button"
import { cva, type VariantProps } from "class-variance-authority"
import { cn } from "cn"
import { Loader2Icon } from "lucide-react"

/*
  Verdant buttons.

  - Two public heights only: 44px (default) and 48px (lg). Both clear the 44px
    touch target minimum, so nothing interactive is smaller than a fingertip.
  - Hover is a 200ms colour/border move on the project easing; press is a 0.97
    scale, which reads as weight without shifting the surrounding layout.
  - Focus uses the global 2px leaf outline rather than a ring, so focus looks
    the same on every surface in the system.
*/
const buttonVariants = cva(
  "group/button inline-flex shrink-0 items-center justify-center gap-2 rounded-lg border border-transparent bg-clip-padding font-medium tracking-[-0.01em] whitespace-nowrap transition-[color,background-color,border-color,opacity,transform] duration-200 ease-verdant outline-none select-none focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring active:scale-[0.97] disabled:pointer-events-none disabled:opacity-45 disabled:active:scale-100 aria-invalid:border-destructive aria-invalid:outline-destructive [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4",
  {
    variants: {
      variant: {
        primary: "bg-forest text-white hover:bg-forest/90",
        default: "bg-forest text-white hover:bg-forest/90",
        /* Outline in ink. The quiet half of every button pair. */
        secondary:
          "border-ink/20 bg-transparent text-ink hover:border-ink/45 hover:bg-ink/[0.04]",
        outline:
          "border-ink/20 bg-transparent text-ink hover:border-ink/45 hover:bg-ink/[0.04]",
        sunken: "bg-mint text-forest hover:bg-leaf/20",
        ghost: "bg-transparent text-ink hover:bg-ink/[0.06]",
        /* For forest and ink surfaces: white fill, forest label. */
        inverted: "bg-white text-forest hover:bg-mint",
        destructive:
          "border-destructive/30 bg-destructive/10 text-destructive hover:bg-destructive/15",
        link: "h-auto rounded-none p-0 text-forest underline-offset-4 hover:underline",
      },
      size: {
        default: "h-11 px-5 text-[0.9375rem]",
        sm: "h-11 px-4 text-[0.9375rem]",
        lg: "h-12 px-6 text-base",
        xs: "h-8 gap-1 rounded-md px-2.5 text-xs [&_svg:not([class*='size-'])]:size-3.5",
        icon: "size-11",
        "icon-xs": "size-8 rounded-md [&_svg:not([class*='size-'])]:size-3.5",
        "icon-sm": "size-9 rounded-md [&_svg:not([class*='size-'])]:size-4",
        "icon-lg": "size-12",
      },
    },
    defaultVariants: {
      variant: "primary",
      size: "default",
    },
  }
)

type ButtonProps = ButtonPrimitive.Props &
  VariantProps<typeof buttonVariants> & {
    /**
     * Loading variant. Swaps the label for a spinner, marks the button busy for
     * assistive tech and blocks a second submit while the action is in flight.
     */
    loading?: boolean
  }

function Button({
  className,
  variant = "primary",
  size = "default",
  loading = false,
  disabled,
  children,
  ...props
}: ButtonProps) {
  return (
    <ButtonPrimitive
      data-slot="button"
      data-loading={loading ? "" : undefined}
      aria-busy={loading || undefined}
      disabled={disabled || loading}
      className={cn(buttonVariants({ variant, size, className }))}
      {...props}
    >
      {loading ? (
        <>
          <Loader2Icon aria-hidden="true" className="animate-spin" />
          <span>{children}</span>
        </>
      ) : (
        children
      )}
    </ButtonPrimitive>
  )
}

export { Button, buttonVariants }
