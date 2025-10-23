"use client"

import useSWR from "swr"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { useToast } from "@/hooks/use-toast"
import { getMarketplace, purchaseDataAccess } from "@/utils/IndexApi"

import { useWallet } from "../context/WalletContext"
import { useMkp } from "../context/TokenMarketplaceContext"

const fetcher = async () => getMarketplace()

export default function MarketplacePage() {
  const { data, isLoading, mutate } = useSWR("marketplace", fetcher)
  const { account: walletAddress } = useWallet();

  const { toast } = useToast()

  async function onPurchase(poolId: string) {
    if (!walletAddress) {
      toast({ title: "Connect wallet", description: "Please connect a wallet to purchase." })
      return
    }
    const p = await purchaseDataAccess(poolId, walletAddress)
    toast({ title: "Purchase successful", description: `Purchase ${p.id} created.` })
    // nothing to refetch here, but if we had credits/inventory, we could mutate.
    mutate()
  }

  return (
    <div className="mx-auto max-w-6xl px-4 py-10">
      <div className="mb-6 flex items-end justify-between animate-fade-up">
        <h1 className="text-3xl font-semibold">Marketplace</h1>
      </div>

      {isLoading ? (
        <p className="text-muted-foreground animate-fade">Loading datasets…</p>
      ) : (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {(data ?? []).map((pool, i) => (
            <Card
              key={pool.id}
              className="flex flex-col animate-fade-up"
              style={{ animationDelay: `${100 + i * 80}ms` }}
            >
              <CardContent className="flex flex-1 flex-col gap-4 p-6">
                <img src="/tabular-data-preview.jpg" alt={`${pool.name} preview`} className="w-full rounded-md" />
                <div className="space-y-1">
                  <h3 className="text-lg font-medium">{pool.name}</h3>
                  <p className="text-sm text-muted-foreground">{pool.description ?? "No description provided."}</p>
                  <p className="text-sm">
                    Owner: <span className="text-muted-foreground">{pool.owner_address}</span>
                  </p>
                </div>
                <div className="mt-auto flex items-center justify-between">
                  <span className="font-medium">{pool.price} credits</span>
                  <Button onClick={() => onPurchase(pool.id)}>Purchase</Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}
