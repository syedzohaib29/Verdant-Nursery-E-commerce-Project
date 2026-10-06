import * as React from "react"
import { Input as InputPrimitive } from "@base-ui/react/input"
import { cn } from "cn"

/*
  Verdant input.

  48px tall with a 20px radius, white fill and a hairline ink border. Error and
  success styling is driven by the attributes the Field primitive puts on the
  control (`aria-invalid` / `data-valid`), so a field never has to be told twice
  what state it is in.
*/
function Input({ className, type, ...props }: React.ComponentProps<"input">) {
  return (
    <InputPrimitive
      type={type}
      data-slot="input"
      className={cn(
        "h-12 w-full min-w-0 rounded-lg border border-ink/15 bg-white px-4 text-body text-ink transition-[color,border-color,background-color] duration-200 ease-verdant outline-none placeholder:text-ink/45 focus-visible:border-forest focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring disabled:pointer-events-none disabled:cursor-not-allowed disabled:bg-ink/[0.03] disabled:text-ink/45 aria-invalid:border-destructive aria-invalid:outline-destructive data-valid:border-leaf",
        className
      )}
      {...props}
    />
  )
}

export { Input }
