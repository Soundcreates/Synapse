"use client";

import useSWR from "swr";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import {
  getMarketplace,
  getBlockchainPoolId,
  confirmPurchase,
  DataPool,
} from "@/utils/IndexApi";

import { useWallet } from "../context/WalletContext";
import { useMkp } from "../context/TokenMarketplaceContext";
import { useEffect, useState } from "react";
import { useDataRegistry } from "../context/DataRegistryContext";

export default function MarketplacePage() {
  const { account: walletAddress } = useWallet();
  const [isLoading, setIsLoading] = useState<Boolean>(false);
  const [dataSets, setDataSets] = useState<DataPool[]>([]);
  const [purchasingIds, setPurchasingIds] = useState<Set<number>>(new Set());
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
    console.log("Starting purchase process for dataset ID:", poolId);

    // Prevent multiple simultaneous purchases of the same dataset
    if (purchasingIds.has(poolId)) {
      toast({
        title: "Purchase in Progress",
        description: "A purchase is already in progress for this dataset.",
        variant: "destructive",
      });
      return;
    }

    // Add to purchasing set
    setPurchasingIds((prev) => new Set([...prev, poolId]));

    try {
      // Step 1: Get blockchain pool ID without updating database
      console.log("Getting blockchain pool ID from backend...");
      const poolIdResponse = await getBlockchainPoolId(poolId, walletAddress);
      console.log("Pool ID response:", poolIdResponse);

      if (!poolIdResponse || !poolIdResponse.success) {
        throw new Error("Failed to get blockchain pool ID");
      }

      const blockchain_pool_id = poolIdResponse.blockchain_pool_id;
      console.log("blockchain-pool-id:", blockchain_pool_id);

      // Step 2: Execute blockchain transaction
      console.log("Executing blockchain transaction...");
      const purchaseTx = await purchaseDataAccessFromChain(blockchain_pool_id);

      if (!purchaseTx) {
        throw new Error("Blockchain transaction failed");
      }

      let transactionHash: string;

      if (typeof purchaseTx === "object" && purchaseTx !== null) {
        // Extract transaction hash
        transactionHash = (purchaseTx as any).hash || "unknown";
        console.log("Transaction hash:", transactionHash);

        // Wait for confirmation if the transaction has a wait method
        if (
          "wait" in purchaseTx &&
          typeof (purchaseTx as any).wait === "function"
        ) {
          try {
            const receipt = await (purchaseTx as any).wait();
            console.log("Transaction confirmed:", receipt);
            // Update transaction hash from receipt if available
            if (receipt && receipt.transactionHash) {
              transactionHash = receipt.transactionHash;
            }
          } catch (waitError) {
            console.error(
              "Error waiting for transaction confirmation:",
              waitError,
            );
            // Transaction was submitted but confirmation failed
            // We still have the hash, so we can proceed
          }
        }
      } else {
        // Fallback for non-standard transaction responses
        console.log("Purchase transaction completed successfully");
        transactionHash = `purchase_${Date.now()}`; // Generate a unique identifier
      }

      // Step 3: Confirm purchase in backend database
      console.log("Confirming purchase in backend...");
      const confirmResponse = await confirmPurchase(
        poolId,
        walletAddress,
        transactionHash,
      );

      if (confirmResponse && confirmResponse.success) {
        console.log(
          "Purchase confirmed successfully:",
          confirmResponse.dataSetPurchased,
        );
        toast({
          title: "Purchase Successful!",
          description:
            "You have successfully purchased access to this dataset.",
        });

        // Refresh the datasets to show updated purchase status
        const response = await getMarketplace();
        if (response.success === true) {
          setDataSets(response.dataSetsList);
        }
      } else {
        throw new Error("Failed to confirm purchase in database");
      }
    } catch (err: any) {
      console.log("Error in purchase process:");
      console.error(err.message);

      // More specific error messages
      let errorTitle = "Purchase Failed";
      let errorDescription = "There was an error processing your purchase.";

      if (
        err.message.includes("insufficient funds") ||
        err.code === "INSUFFICIENT_FUNDS"
      ) {
        errorTitle = "Insufficient Funds";
        errorDescription =
          "You don't have enough funds to complete this purchase. Please add more funds to your wallet and try again.";
      } else if (
        err.message.includes("user rejected") ||
        err.code === "ACTION_REJECTED"
      ) {
        errorTitle = "Transaction Rejected";
        errorDescription =
          "You rejected the transaction. Please try again if you want to purchase this dataset.";
      } else if (err.message.includes("already purchased")) {
        errorTitle = "Already Purchased";
        errorDescription = "You have already purchased this dataset.";
      } else if (err.message.includes("Failed to get blockchain pool ID")) {
        errorTitle = "Dataset Not Available";
        errorDescription =
          "This dataset is not available for purchase at the moment.";
      }

      toast({
        title: errorTitle,
        description: errorDescription,
        variant: "destructive",
      });
    } finally {
      // Remove from purchasing set
      setPurchasingIds((prev) => {
        const newSet = new Set(prev);
        newSet.delete(poolId);
        return newSet;
      });
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
                  <Button
                    onClick={() => onPurchase(pool.id)}
                    disabled={purchasingIds.has(pool.id)}
                  >
                    {purchasingIds.has(pool.id) ? "Purchasing..." : "Purchase"}
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
