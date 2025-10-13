"use client"

import { Button } from "@/components/ui/button"
import { useLedger } from "@/contexts/ledger-context"

function short(addr: string) {
  return addr.slice(0, 6) + "..." + addr.slice(-4)
}

export function WalletConnect() {
  const { walletAddress, connect, disconnect } = useLedger()

  return walletAddress ? (
    <div className="flex items-center gap-2 animate-fade animation-delay-150">
      <span className="rounded-md bg-secondary px-2 py-1 text-xs">{short(walletAddress)}</span>
      <Button variant="outline" onClick={disconnect}>
        Disconnect
      </Button>
    </div>
  ) : (
    <Button className="animate-fade animation-delay-150" onClick={connect}>
      Connect Wallet
    </Button>
  )
}
