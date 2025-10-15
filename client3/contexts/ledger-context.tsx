"use client"

import React from "react"

type LedgerContextValue = {
  walletAddress: string | null
  connect: () => void
  disconnect: () => void
  isClient: boolean
}

const LedgerContext = React.createContext<LedgerContextValue | undefined>(undefined)

function randomWallet(): string {
  const rand = Math.random().toString(16).slice(2).padEnd(40, "0")
  return "0x" + rand.slice(0, 40)
}

export function LedgerProvider({ children }: { children: React.ReactNode }) {
  const [walletAddress, setWalletAddress] = React.useState<string | null>(null)
  const [isClient, setIsClient] = React.useState(false)

  React.useEffect(() => {
    setIsClient(true)
    // Restore wallet address from localStorage if it exists
    const stored = localStorage.getItem("ledger-wallet")
    if (stored) {
      setWalletAddress(stored)
    }
  }, [])

  const connect = React.useCallback(() => {
    if (!isClient) return
    const newWallet = randomWallet()
    setWalletAddress(newWallet)
    localStorage.setItem("ledger-wallet", newWallet)
  }, [isClient])

  const disconnect = React.useCallback(() => {
    setWalletAddress(null)
    if (isClient) {
      localStorage.removeItem("ledger-wallet")
    }
  }, [isClient])

  const value = React.useMemo(() => ({ walletAddress, connect, disconnect, isClient }), [walletAddress, connect, disconnect, isClient])

  return <LedgerContext.Provider value={value}>{children}</LedgerContext.Provider>
}

export function useLedger() {
  const ctx = React.useContext(LedgerContext)
  if (!ctx) throw new Error("useLedger must be used within LedgerProvider")
  return ctx
}
