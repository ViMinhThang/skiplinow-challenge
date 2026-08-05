"use client"

import { Input } from "@/components/ui/input"
import { cn } from "@/lib/utils"

interface IconInputProps extends React.ComponentProps<"input"> {
  icon: React.ReactNode
}

export function IconInput({ icon, className, ...props }: IconInputProps) {
  return (
    <div className="relative">
      <span className="pointer-events-none absolute top-1/2 left-2.5 -translate-y-1/2 text-muted-foreground [&_svg]:size-4">
        {icon}
      </span>
      <Input className={cn("pl-8", className)} {...props} />
    </div>
  )
}
