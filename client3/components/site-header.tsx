"use client"

import Link from "next/link"
import Image from "next/image"
import { WalletConnect } from "@/components/wallet-connect"

export function SiteHeader() {
  return (
    <header className="sticky top-0 z-40 border-b bg-background/80 backdrop-blur supports-[backdrop-filter]:bg-background/60 animate-slide-down">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4">
        <Link href="/" className="flex items-center gap-3">
          <Image
            src="/public/placeholder-logo.png"
            alt="Synapse Ledger logo"
            width={28}
            height={28}
            className="rounded"
          />
          <span className="font-semibold">Synapse Ledger</span>
        </Link>

        <nav className="hidden items-center gap-6 md:flex">
          <Link href="/" className="text-sm hover:opacity-80">
            Home
          </Link>
          <Link href="/upload" className="text-sm hover:opacity-80">
            Data Upload
          </Link>
          <Link href="/marketplace" className="text-sm hover:opacity-80">
            Marketplace
          </Link>
          <Link href="/dashboard" className="text-sm hover:opacity-80">
            Dashboard
          </Link>
        </nav>

        <div className="flex items-center gap-2">
          <WalletConnect />
        </div>
      </div>
    </header>
  )
}
