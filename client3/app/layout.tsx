

import type React from "react"
import type { Metadata } from "next"
import { GeistSans } from "geist/font/sans"
import { GeistMono } from "geist/font/mono"
import { Analytics } from "@vercel/analytics/next"
import "./globals.css"
import { ThemeProvider } from "@/components/theme-provider"
import { Toaster } from "@/components/ui/toaster"
import { SiteHeader } from "@/components/site-header"

import { Suspense } from "react"
import { PageTransition } from "@/components/page-transition"
import { WalletProvider } from "./context/WalletContext"
import { DataRegistryContextProvider } from "./context/DataRegistryContext"
import { AOSInit } from "@/components/aos-init"
import { TokenMarketPlaceProvider } from "./context/TokenMarketplaceContext"


export const metadata: Metadata = {
  title: "Synapse",
  description: "Monetize and Access Data with Confidence - A data marketplace where you can upload datasets, create pools, and purchase access with a mock wallet.",
  generator: "Soundcreates",
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en">
      <body className={`font-sans ${GeistSans.variable} ${GeistMono.variable}`}>

        <WalletProvider>
          <TokenMarketPlaceProvider>

            <DataRegistryContextProvider>
              <ThemeProvider attribute="class" defaultTheme="dark" enableSystem={false}>

                <AOSInit />
                <Suspense fallback={<div>Loading...</div>}>
                  <SiteHeader />
                  <main className="min-h-[calc(100vh-64px)]">
                    <PageTransition>{children}</PageTransition>
                  </main>
                  <Toaster />
                </Suspense>

              </ThemeProvider>
              <Analytics />
            </DataRegistryContextProvider>
          </TokenMarketPlaceProvider>


        </WalletProvider>
      </body>
    </html>
  )
}
