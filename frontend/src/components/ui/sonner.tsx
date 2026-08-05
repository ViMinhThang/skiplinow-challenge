"use client"

import { useTheme } from "next-themes"
import { Toaster as Sonner, type ToasterProps } from "sonner"
import { CircleCheckIcon, InfoIcon, TriangleAlertIcon, OctagonXIcon, Loader2Icon } from "lucide-react"

const Toaster = ({ ...props }: ToasterProps) => {
  const { theme = "system" } = useTheme()

  return (
    <Sonner
      theme={theme as ToasterProps["theme"]}
      className="toaster group"
      icons={{
        success: (
          <CircleCheckIcon className="size-4" />
        ),
        info: (
          <InfoIcon className="size-4" />
        ),
        warning: (
          <TriangleAlertIcon className="size-4" />
        ),
        error: (
          <OctagonXIcon className="size-4" />
        ),
        loading: (
          <Loader2Icon className="size-4 animate-spin" />
        ),
      }}
      style={
        {
          "--normal-bg": "var(--popover)",
          "--normal-text": "var(--popover-foreground)",
          "--normal-border": "var(--border)",
          "--success-bg": "color-mix(in srgb, var(--success) 12%, var(--popover))",
          "--success-border": "color-mix(in srgb, var(--success) 32%, var(--border))",
          "--success-text": "var(--success)",
          "--info-bg": "color-mix(in srgb, var(--ring) 12%, var(--popover))",
          "--info-border": "color-mix(in srgb, var(--ring) 32%, var(--border))",
          "--info-text": "var(--ring)",
          "--warning-bg": "color-mix(in srgb, var(--warning) 12%, var(--popover))",
          "--warning-border": "color-mix(in srgb, var(--warning) 32%, var(--border))",
          "--warning-text": "var(--warning)",
          "--error-bg": "color-mix(in srgb, var(--destructive) 12%, var(--popover))",
          "--error-border": "color-mix(in srgb, var(--destructive) 32%, var(--border))",
          "--error-text": "var(--destructive)",
          "--border-radius": "var(--radius)",
        } as React.CSSProperties
      }
      {...props}
    />
  )
}

export { Toaster }
