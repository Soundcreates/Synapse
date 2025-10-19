"use client"

import Link from "next/link"
import Image from "next/image"
import { usePathname } from "next/navigation"
import { WalletConnect } from "@/components/wallet-connect"
import { cn } from "@/lib/utils"

export function SiteHeader() {
  const pathname = usePathname()

  const navItems = [
    { href: "/", label: "Home" },
    { href: "/upload", label: "Data Upload" },
    { href: "/marketplace", label: "Marketplace" },
    { href: "/dashboard", label: "Dashboard" },
    { href: "/buy", label: "Buy Tokens" },
  ]

  return (
    <header className="sticky top-0 z-40 border-b bg-background/80 backdrop-blur supports-[backdrop-filter]:bg-background/60 animate-slide-down">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4">
        <Link href="/" className="flex items-center gap-3">
          {/* <Image
            src="/public/placeholder-logo.png"
            alt="Synapse Ledger logo"
            width={28}
            height={28}
            className="rounded"
          /> */}
          <span className="font-semibold">Synapse</span>
        </Link>

        <nav className="hidden items-center gap-6 md:flex">
          {navItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "text-sm transition-colors hover:text-foreground/80",
                pathname === item.href
                  ? "text-foreground font-medium"
                  : "text-foreground/60"
              )}
            >
              {item.label}
            </Link>
          ))}
        </nav>

        <div className="flex items-center gap-2">
          <WalletConnect />
        </div>
      </div>
    </header>
  )
}
