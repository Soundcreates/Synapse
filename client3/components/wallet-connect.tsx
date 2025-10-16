"use client"

import { useWallet } from "@/app/context/WalletContext"
import { Button } from "@/components/ui/button"
import { useToast } from "@/hooks/use-toast"

function short(addr: string) {
  return addr.slice(0, 6) + "..." + addr.slice(-4)
}

export function WalletConnect() {
  const { account, loadAccount, disconnectWallet, isClient } = useWallet()
  const { toast } = useToast();

  // Prevent hydration mismatch by not rendering until client-side
  if (!isClient) {
    return (
      <Button variant="outline" disabled>
        Loading...
      </Button>
    )
  }

  const handleConnect = async () => {
    await loadAccount()
    toast({
      title: "Success!",
      description: "Wallet connected successfully.",
      variant: "default",
    })
  }

  const handleDisconnect = () => {
    disconnectWallet()
    toast({
      title: "Disconnected",
      description: "Wallet disconnected successfully.",
      variant: "destructive",
    })
  }

  return account ? (
    <div className="flex items-center gap-2 animate-fade animation-delay-150">
      <span className="rounded-md bg-secondary px-2 py-1 text-xs">{short(account)}</span>
      <Button variant="outline" onClick={handleDisconnect}>
        Disconnect
      </Button>
    </div>
  ) : (
    <Button className="animate-fade animation-delay-150" onClick={handleConnect}>
      Connect Wallet
    </Button>
  )
}
