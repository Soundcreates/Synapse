"use client"

import React from "react"

type LedgerContextValue = {
  walletAddress: string | null
  connect: () => void
  disconnect: () => void
}

const LedgerContext = React.createContext<LedgerContextValue | undefined>(undefined)

function randomWallet(): string {
  const rand = Math.random().toString(16).slice(2).padEnd(40, "0")
  return "0x" + rand.slice(0, 40)
}

export function LedgerProvider({ children }: { children: React.ReactNode }) {
  const [walletAddress, setWalletAddress] = React.useState<string | null>(null)

  const connect = React.useCallback(() => {
    setWalletAddress(randomWallet())
  }, [])

  const disconnect = React.useCallback(() => {
    setWalletAddress(null)
  }, [])

  const value = React.useMemo(() => ({ walletAddress, connect, disconnect }), [walletAddress, connect, disconnect])

  return <LedgerContext.Provider value={value}>{children}</LedgerContext.Provider>
}

export function useLedger() {
  const ctx = React.useContext(LedgerContext)
  if (!ctx) throw new Error("useLedger must be used within LedgerProvider")
  return ctx
}
