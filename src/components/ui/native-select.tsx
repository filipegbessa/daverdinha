import * as React from "react"

import { cn } from "@/lib/utils"

/**
 * A plain `<select>` with the same look as `Input`. Native on purpose: it
 * gets the phone's own picker and keyboard handling for free, and every
 * filter and form in the admin is a short list.
 */
function NativeSelect({ className, ...props }: React.ComponentProps<"select">) {
  return (
    <select
      data-slot="native-select"
      className={cn(
        "h-8 w-full min-w-0 rounded-lg border border-input bg-transparent px-2.5 text-base transition-colors outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 disabled:cursor-not-allowed disabled:opacity-50 md:text-sm dark:bg-input/30",
        className
      )}
      {...props}
    />
  )
}

export { NativeSelect }
