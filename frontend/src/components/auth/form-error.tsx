import { TriangleAlertIcon } from "lucide-react"

export function FormError({ message }: { message: string }) {
  return (
    <p className="flex items-center gap-1.5 text-sm text-destructive">
      <TriangleAlertIcon className="size-4 shrink-0" />
      {message}
    </p>
  )
}
