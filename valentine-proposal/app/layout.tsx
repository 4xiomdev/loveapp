import "./globals.css"
import { Inter, Pacifico } from "next/font/google"
import type React from "react"

const inter = Inter({ subsets: ["latin"] })
const pacifico = Pacifico({ weight: "400", subsets: ["latin"] })

export const metadata = {
  title: "Valentine Proposal",
  description: "A cute and creative Valentine proposal",
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body className={`${inter.className} ${pacifico.variable}`}>{children}</body>
    </html>
  )
}

