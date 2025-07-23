import type React from "react"
import type { Metadata } from "next"
import { Inter } from "next/font/google"
import "./globals.css"
import { ThemeProvider } from "@/components/theme-provider"
import { Toaster } from "@/components/ui/toaster" // Importa Toaster

const inter = Inter({ subsets: ["latin"] })

export const metadata: Metadata = {
  title: "Gestor de Contraseñas",
  description: "Un gestor de contraseñas simple construido con Next.js y Supabase.",
    generator: 'v0.dev'
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="es" suppressHydrationWarning>
      <body className={inter.className}>
        <ThemeProvider attribute="class" defaultTheme="system" enableSystem disableTransitionOnChange>
          {children}
          <Toaster /> {/* Renderiza Toaster aquí */}
        </ThemeProvider>
      </body>
    </html>
  )
}
