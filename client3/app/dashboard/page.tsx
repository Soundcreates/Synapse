"use client"

import useSWR from "swr"
import { Card, CardContent } from "@/components/ui/card"
// import { useLedger } from "@/contexts/ledger-context"

import { getUserDashboard } from "@/utils/IndexApi"
import { useWallet } from "../context/WalletContext"
import { CREDIT_TO_ETH_RATIO } from "../../utils/pricingMigration";

// Helper function to convert credits to ETH for display
const creditsToEth = (credits: number) => {
  return (credits * CREDIT_TO_ETH_RATIO).toFixed(4);
};

export default function DashboardPage() {
  const { account: walletAddress } = useWallet();
  const { data, isLoading } = useSWR(walletAddress ? ["dashboard", walletAddress] : null, () =>
    getUserDashboard(walletAddress!),
  )

  if (!walletAddress) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-10">
        <h1 className="mb-4 text-3xl font-semibold">Your Dashboard</h1>
        <p className="text-muted-foreground">Connect a wallet to view your data pools and purchases.</p>
      </div>
    )
  }

  return (
    <div className="mx-auto max-w-6xl px-4 py-10">
      <h1 className="mb-6 text-3xl font-semibold animate-fade-up">Your Dashboard</h1>

      {isLoading ? (
        <p className="text-muted-foreground animate-fade">Loading…</p>
      ) : (
        <div className="grid gap-8 md:grid-cols-2">
          <section className="animate-fade-up">
            <h2 className="mb-3 text-xl font-medium">Your Data Pools</h2>
            <div className="grid gap-4">
              {(data?.myPools ?? []).length === 0 && (
                <p className="text-muted-foreground">No pools yet. Try uploading one.</p>
              )}
              {(data?.myPools ?? []).map((p, i) => (
                <Card key={p.id} className="animate-fade-up" style={{ animationDelay: `${120 + i * 80}ms` }}>
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <div className="font-medium">{p.name}</div>
                        <div className="text-sm text-muted-foreground">
                          Price: {p.price} credits (~{creditsToEth(p.price)} ETH) • IPFS: {p.ipfs_hash}
                        </div>
                      </div>
                      <div className="text-sm">ID: {p.id}</div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </section>

          <section className="animate-fade-up animation-delay-100">
            <h2 className="mb-3 text-xl font-medium">Your Purchases</h2>
            <div className="grid gap-4">
              {(data?.purchasedPools ?? []).length === 0 && <p className="text-muted-foreground">No purchases found.</p>}
              {(data?.purchasedPools ?? []).map((p, i) => (
                <Card key={p.id} className="animate-fade-up" style={{ animationDelay: `${120 + i * 80}ms` }}>
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <div className="font-medium">{p.name}</div>
                        <div className="text-sm text-muted-foreground">
                          Owner: {p.owner_address} • Price: {p.price} credits (~{creditsToEth(p.price)} ETH)
                        </div>
                      </div>
                      <div className="text-sm">ID: {p.id}</div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </section>
        </div>
      )}
    </div>
  )
}
