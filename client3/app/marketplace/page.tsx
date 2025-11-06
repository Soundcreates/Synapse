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

import { useMkp } from "../context/TokenMarketplaceContext";
import { useEffect, useState } from "react";
import { useDataRegistry } from "../context/DataRegistryContext";
import { useWallet } from "../context/WalletContext";
import getBaseWebpackConfig from "next/dist/build/webpack-config";

export default function MarketplacePage() {
  const { account: walletAddress } = useWallet();
  const [isLoading, setIsLoading] = useState<Boolean>(false);
  const [dataSets, setDataSets] = useState<DataPool[]>([]);
  const [purchasingIds, setPurchasingIds] = useState<Set<number>>(new Set());
  const { purchaseDataAccessFromChain, getDataPool } = useDataRegistry();

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

  async function onPurchase(poolId: number, buyer: String) {
    console.log("Starting purchase process for dataset ID:", poolId);

    // Check if wallet is connected
    if (!walletAddress || walletAddress.trim() === "") {
      toast({
        title: "Wallet Not Connected",
        description: "Please connect your wallet to purchase datasets.",
        variant: "destructive",
      });
      return;
    }

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
      const poolIdResponse = await getBlockchainPoolId(poolId, walletAddress!);
      console.log("Pool ID response:", poolIdResponse);

      if (!poolIdResponse || !poolIdResponse.success) {
        throw new Error("Failed to get blockchain pool ID");
      }

      const blockchain_pool_id = poolIdResponse.blockchain_pool_id;

      if (blockchain_pool_id === null || blockchain_pool_id === undefined) {
        throw new Error(
          "Dataset does not have a valid blockchain pool. Please contact the dataset owner to recreate the pool.",
        );
      }

      console.log("blockchain-pool-id:", blockchain_pool_id);

      // Step 1.5: Validate pool exists and is active on blockchain
      console.log("Validating pool on blockchain...");
      try {
        const poolData = await getDataPool(Number(blockchain_pool_id));
        if (!poolData) {
          throw new Error(
            "This dataset's blockchain pool was not found. The pool may have been deleted or never created. Please contact the dataset owner.",
          );
        }
        if (!poolData.isActive) {
          throw new Error(
            "This dataset's blockchain pool is currently inactive. Please contact the dataset owner to reactivate it.",
          );
        }
        console.log("Pool validation successful:", poolData);
      } catch (validationError: any) {
        console.error("Pool validation failed:", validationError);
        // Check for specific blockchain connection errors
        if (
          validationError.message.includes("could not detect network") ||
          validationError.message.includes("connection")
        ) {
          throw new Error(
            "Unable to connect to blockchain. Please check your wallet connection and try again.",
          );
        }
        throw new Error(
          `Unable to validate dataset pool: ${validationError.message}`,
        );
      }

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
        walletAddress!,
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
        try {
          const response = await getMarketplace();
          if (response && response.success === true && response.dataSetsList) {
            setDataSets(response.dataSetsList);
          }
        } catch (refreshError) {
          console.warn("Failed to refresh marketplace data:", refreshError);
          // Don't throw here as the purchase was successful
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
        err.message.includes("Pool is not active") ||
        err.message.includes("inactive")
      ) {
        errorTitle = "Dataset Unavailable";
        errorDescription =
          "This dataset's blockchain pool is currently inactive. Please contact the dataset owner.";
      } else if (
        err.message.includes("Pool does not exist") ||
        err.message.includes("not found")
      ) {
        errorTitle = "Dataset Pool Missing";
        errorDescription =
          "This dataset's blockchain pool could not be found. The owner may need to recreate it.";
      } else if (
        err.message.includes("does not have a valid blockchain pool")
      ) {
        errorTitle = "Pool Not Created";
        errorDescription =
          "This dataset doesn't have a blockchain pool yet. Please contact the dataset owner.";
      } else if (
        err.message.includes("blockchain connection") ||
        err.message.includes("wallet connection")
      ) {
        errorTitle = "Connection Error";
        errorDescription =
          "Unable to connect to blockchain. Please check your wallet connection and try again.";
      } else if (
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
    <>
      <div className="mx-auto max-w-6xl px-4 py-10">
        <div className="mb-6 flex items-end justify-between animate-fade-up">
          <h1 className="text-3xl font-semibold">Marketplace</h1>
        </div>

        {isLoading ? (
          <p className="text-muted-foreground animate-fade">
            Loading datasets…
          </p>
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
                    <div className="flex items-center gap-2">
                      <h3 className="text-lg font-medium">{pool.name}</h3>
                      {pool.blockchain_pool_id === null && (
                        <span className="px-2 py-1 text-xs bg-yellow-100 text-yellow-800 rounded">
                          Pool Missing
                        </span>
                      )}
                    </div>
                    <p className="text-sm text-muted-foreground">
                      {pool.description ?? "No description provided."}
                    </p>
                    <p className="text-sm">
                      Owner:{" "}
                      <span className="text-muted-foreground">
                        {pool.owner_address}
                      </span>
                    </p>
                    {pool.blockchain_pool_id !== null && (
                      <p className="text-xs text-muted-foreground">
                        Pool ID: {pool.blockchain_pool_id}
                      </p>
                    )}
                  </div>
                  <div className="mt-auto flex items-center justify-between">
                    <div className="text-sm">
                      <span className="font-medium">
                        {pool.price} SYN tokens
                      </span>
                    </div>
                    <Button
                      onClick={() => onPurchase(pool.id, walletAddress || "")}
                      disabled={
                        purchasingIds.has(pool.id) ||
                        pool.blockchain_pool_id === null
                      }
                      variant={
                        pool.blockchain_pool_id === null
                          ? "secondary"
                          : "default"
                      }
                    >
                      {purchasingIds.has(pool.id)
                        ? "Purchasing..."
                        : pool.blockchain_pool_id === null
                          ? "Unavailable"
                          : pool.purchasers?.includes(walletAddress)
                            ? "Purchased"
                            : "Purchase"}
                    </Button>
                    <Button
                      className="bg-black border-2 border-white text-white hover:bg-white hover:border-black hover:text-black transition-all duration-300 cursor-pointer"
                      onClick={}
                    >
                      Contribute
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </>
  );
}
