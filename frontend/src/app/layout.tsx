import type { Metadata } from "next"
import { Poppins } from "next/font/google"

import { Providers } from "@/components/providers"

import "./globals.css"

const poppins = Poppins({
  weight: ["400", "500", "600", "700"],
  variable: "--font-poppins",
  subsets: ["latin"],
})

export const metadata: Metadata = {
  title: "TaskFlow — Employee Task Management",
  description:
    "Real-time employee task management tool for managers and employees.",
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en" className={poppins.variable} suppressHydrationWarning>
      <body className="antialiased">
        <Providers>{children}</Providers>
      </body>
    </html>
  )
}
