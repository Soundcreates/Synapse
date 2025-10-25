"use client";

import useSWR from "swr";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { getMarketplace, purchaseDataAccess, DataPool } from "@/utils/IndexApi";

import { useWallet } from "../context/WalletContext";
import { useMkp } from "../context/TokenMarketplaceContext";
import { useEffect, useState } from "react";
import { useDataRegistry } from "../context/DataRegistryContext";

export default function MarketplacePage() {
  const { account: walletAddress } = useWallet();
  const [isLoading, setIsLoading] = useState<Boolean>(false);
  const [dataSets, setDataSets] = useState<DataPool[]>([]);
  const { purchaseDataAccessFromChain } = useDataRegistry();

  useEffect(() => {
    const fetcher = async () => {
      setIsLoading(true);
      try {
        const response = await getMarketplace();
        if (response.success === true) {
          setDataSets(response.dataSetsList);
          console.log("datasets fetched: ", response.dataSetsList);
        } else {
          console.error("Failed to fetch datasets");
          setDataSets([]);
        }
      } catch (error) {
        console.error("Error fetching datasets:", error);
        setDataSets([]);
      } finally {
        setIsLoading(false);
      }
    };

    fetcher();
  }, []); // Remove dataSets from dependencies to prevent infinite loop

  const { toast } = useToast();

  async function onPurchase(poolId: number) {
    console.log("mock purchase for dataset ID:", poolId);

    try {
      console.log(
        "Sending it to backend factory to retreive the blockchain-pool-id",
      );
      const backendResponse = await purchaseDataAccess(poolId, walletAddress);
      console.log("The backends response is: ", backendResponse);
      if (backendResponse && backendResponse.success == true) {
        const blockchain_pool_id = backendResponse.blockchain_pool_id;
        console.log("blockchain-pool-id: ", blockchain_pool_id);
        const purchaseTx =
          await purchaseDataAccessFromChain(blockchain_pool_id);

        const receipt = await purchaseTx.wait();
        console.log("Purchase transaction has happened: ", receipt);
      }
    } catch (err: any) {
      console.log(
        "Error happened at marketplace buy page in onPurchase function",
      );
      console.error(err.message);
    }
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
          {(dataSets ?? []).map((pool: DataPool, i) => (
            <Card
              key={pool.id}
              className="flex flex-col animate-fade-up"
              style={{ animationDelay: `${100 + i * 80}ms` }}
            >
              <CardContent className="flex flex-1 flex-col gap-4 p-6">
                <img
                  src="/tabular-data-preview.jpg"
                  alt={`${pool.name} preview`}
                  className="w-full rounded-md"
                />
                <div className="space-y-1">
                  <h3 className="text-lg font-medium">{pool.name}</h3>
                  <p className="text-sm text-muted-foreground">
                    {pool.description ?? "No description provided."}
                  </p>
                  <p className="text-sm">
                    Owner:{" "}
                    <span className="text-muted-foreground">
                      {pool.owner_address}
                    </span>
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
  );
}
