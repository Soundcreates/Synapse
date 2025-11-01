"use client";

import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useDataRegistry } from "../context/DataRegistryContext";
import { fetchData } from "@/utils/baseUrl";
import { useToast } from "@/hooks/use-toast";
import { validateBlockchainPools } from "@/utils/IndexApi";
import { ethers } from "ethers";
import { isOldPricingSystem, weiToCredits, CREDIT_TO_ETH_RATIO } from "../../utils/pricingMigration";

type DatabaseDataset = {
  id: number;
  name: string;
  blockchain_pool_id: number | null;
  owner_address: string;
  price: number;
  created_at: string;
};

type BlockchainPool = {
  id: number;
  creator: string;
  ipfsHash: string;
  metadataHash: string;
  pricePerAccess: string;
  totalContributors: number;
  isActive: boolean;
};

export default function AdminPage() {
  const { toast } = useToast();
  const { getDataPool, getNextPoolId, createDataPool } = useDataRegistry();
  const [datasets, setDatasets] = useState<DatabaseDataset[]>([]);
  const [blockchainPools, setBlockchainPools] = useState<BlockchainPool[]>([]);
  const [nextPoolId, setNextPoolId] = useState<number | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchDatabaseDatasets();
    fetchBlockchainData();
  }, []);

  const fetchDatabaseDatasets = async () => {
    try {
      const response = await fetchData.get("/datasets");
      if (response && response.data.success) {
        setDatasets(response.data.allDatasets);
      }
    } catch (error) {
      console.error("Error fetching datasets:", error);
    }
  };

  const fetchBlockchainData = async () => {
    try {
      const nextId = await getNextPoolId();
      setNextPoolId(nextId);

      if (nextId) {
        const pools: BlockchainPool[] = [];
        for (let i = 0; i < nextId; i++) {
          const pool = await getDataPool(i);
          if (pool) {
            pools.push({
              id: i,
              creator: pool.creator,
              ipfsHash: pool.ipfsHash,
              metadataHash: pool.metadataHash,
              pricePerAccess: pool.pricePerAccess.toString(),
              totalContributors: pool.totalContributors,
              isActive: pool.isActive,
            });
          }
        }
        setBlockchainPools(pools);
      }
    } catch (error) {
      console.error("Error fetching blockchain data:", error);
    }
  };

  const createMissingBlockchainPools = async () => {
    setLoading(true);
    try {
      const datasetsWithoutBlockchainId = datasets.filter(
        (dataset) => dataset.blockchain_pool_id === null
      );

      for (const dataset of datasetsWithoutBlockchainId) {
        try {
          // Create metadata
          const metadata = {
            name: dataset.name,
            description: `Dataset: ${dataset.name}`,
            price: dataset.price,
            owner: dataset.owner_address,
          };

          const metadataBlob = new Blob([JSON.stringify(metadata)], {
            type: "application/json",
          });

          // For now, we'll use a placeholder IPFS hash since we don't have the original
          const placeholderIpfsHash = "QmPlaceholder" + dataset.id;
          const placeholderMetadataHash = "QmMetadata" + dataset.id;

          const result = await createDataPool(
            placeholderIpfsHash,
            placeholderMetadataHash,
            dataset.price.toString()
          );

          if (result && result.success && result.poolId) {
            // Update the database with the new blockchain pool ID
            await fetchData.patch(`/datasets/${dataset.id}`, {
              blockchain_pool_id: result.poolId,
              tx_hash: result.tx_hash,
            });

            toast({
              title: "Pool Created",
              description: `Created blockchain pool ${result.poolId} for dataset "${dataset.name}"`,
            });
          }
        } catch (error) {
          console.error(`Error creating pool for dataset ${dataset.id}:`, error);
          toast({
            title: "Error",
            description: `Failed to create pool for dataset "${dataset.name}"`,
            variant: "destructive",
          });
        }
      }

      // Refresh data
      await fetchDatabaseDatasets();
      await fetchBlockchainData();
    } catch (error) {
      console.error("Error creating missing pools:", error);
    } finally {
      setLoading(false);
    }
  };

  const syncDatabaseWithBlockchain = async () => {
    setLoading(true);
    try {
      // Find datasets with blockchain_pool_id that don't exist or are inactive
      const problematicDatasets = datasets.filter((dataset) => {
        if (dataset.blockchain_pool_id === null) return false; // These will be handled by createMissingBlockchainPools

        const blockchainPool = blockchainPools.find(
          (pool) => pool.id === dataset.blockchain_pool_id
        );

        return !blockchainPool || !blockchainPool.isActive;
      });

      for (const dataset of problematicDatasets) {
        try {
          // Reset blockchain_pool_id to null so they can be recreated
          await fetchData.patch(`/datasets/${dataset.id}`, {
            blockchain_pool_id: null,
          });

          toast({
            title: "Dataset Reset",
            description: `Reset blockchain pool ID for dataset "${dataset.name}"`,
          });
        } catch (error) {
          console.error(`Error resetting dataset ${dataset.id}:`, error);
        }
      }

      // Refresh data
      await fetchDatabaseDatasets();
    } catch (error) {
      console.error("Error syncing database:", error);
    } finally {
      setLoading(false);
    }
  };

  const validatePools = async () => {
    setLoading(true);
    try {
      const result = await validateBlockchainPools();

      if (result.success) {
        toast({
          title: "Validation Complete",
          description: `${result.message}. Fixed: ${result.fixed || 0}/${result.total || 0} datasets.`,
        });

        // Refresh data after validation
        await fetchDatabaseDatasets();
        await fetchBlockchainData();
      } else {
        toast({
          title: "Validation Failed",
          description: result.message,
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error("Error validating pools:", error);
      toast({
        title: "Error",
        description: "Failed to validate blockchain pools",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const quickResetAllPools = async () => {
    if (!confirm("This will reset ALL blockchain pool IDs to null. Are you sure?")) {
      return;
    }

    setLoading(true);
    try {
      // Reset all datasets to have null blockchain_pool_id
      const datasetsToReset = datasets.filter(d => d.blockchain_pool_id !== null);

      for (const dataset of datasetsToReset) {
        await fetchData.patch(`/datasets/${dataset.id}`, {
          blockchain_pool_id: null,
        });
      }

      toast({
        title: "Reset Complete",
        description: `Reset ${datasetsToReset.length} datasets. They can now be recreated.`,
      });

      // Refresh data
      await fetchDatabaseDatasets();
      await fetchBlockchainData();
    } catch (error) {
      console.error("Error resetting pools:", error);
      toast({
        title: "Error",
        description: "Failed to reset blockchain pools",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container mx-auto p-6">
      <h1 className="text-3xl font-bold mb-6">Admin Dashboard</h1>

      <div className="grid gap-6">
        {/* Actions */}
        <Card>
          <CardHeader>
            <CardTitle>Admin Actions</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <Button
              onClick={createMissingBlockchainPools}
              disabled={loading}
              className="w-full"
            >
              {loading ? "Processing..." : "Create Missing Blockchain Pools"}
            </Button>

            <Button
              onClick={syncDatabaseWithBlockchain}
              disabled={loading}
              variant="outline"
              className="w-full"
            >
              {loading ? "Processing..." : "Reset Inactive/Invalid Pool References"}
            </Button>

            <Button
              onClick={validatePools}
              disabled={loading}
              variant="outline"
              className="w-full"
            >
              {loading ? "Processing..." : "Validate & Fix Blockchain Pools"}
            </Button>

            <Button
              onClick={quickResetAllPools}
              disabled={loading}
              variant="destructive"
              className="w-full"
            >
              {loading ? "Processing..." : " RESET ALL Pool IDs to NULL"}
            </Button>

            <Button
              onClick={() => {
                fetchDatabaseDatasets();
                fetchBlockchainData();
              }}
              variant="secondary"
              className="w-full"
            >
              Refresh Data
            </Button>
          </CardContent>
        </Card>

        {/* Statistics */}
        <div className="grid md:grid-cols-2 lg:grid-cols-5 gap-4">
          <Card>
            <CardContent className="p-6">
              <div className="text-2xl font-bold">{datasets.length}</div>
              <p className="text-sm text-muted-foreground">Total Datasets</p>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="text-2xl font-bold">{blockchainPools.length}</div>
              <p className="text-sm text-muted-foreground">Blockchain Pools</p>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="text-2xl font-bold">
                {datasets.filter(d => d.blockchain_pool_id === null).length}
              </div>
              <p className="text-sm text-muted-foreground">Missing Blockchain IDs</p>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="text-2xl font-bold">
                {datasets.filter(d => d.blockchain_pool_id !== null).length}
              </div>
              <p className="text-sm text-muted-foreground">Have Pool IDs</p>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="text-2xl font-bold text-red-600">
                {blockchainPools.filter(pool =>
                  isOldPricingSystem(BigInt(pool.pricePerAccess))
                ).length}
              </div>
              <p className="text-sm text-muted-foreground">Old Pricing Issues</p>
            </CardContent>
          </Card>
        </div>

        {/* Database Datasets */}
        <Card>
          <CardHeader>
            <CardTitle>Database Datasets</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {datasets.map((dataset) => {
                const blockchainPool = blockchainPools.find(
                  (pool) => pool.id === dataset.blockchain_pool_id
                );

                const status = dataset.blockchain_pool_id === null
                  ? "No Blockchain Pool"
                  : blockchainPool
                    ? blockchainPool.isActive
                      ? "Active"
                      : "Inactive"
                    : "Pool Not Found";

                const statusColor = status === "Active"
                  ? "text-green-600"
                  : "text-red-600";

                // Check for pricing issues
                const hasOldPricing = blockchainPool &&
                  isOldPricingSystem(BigInt(blockchainPool.pricePerAccess));

                const displayPrice = blockchainPool
                  ? hasOldPricing
                    ? `${ethers.formatEther(blockchainPool.pricePerAccess)} ETH (OLD PRICING!)`
                    : `${weiToCredits(BigInt(blockchainPool.pricePerAccess)).toFixed(2)} credits (~${(weiToCredits(BigInt(blockchainPool.pricePerAccess)) * CREDIT_TO_ETH_RATIO).toFixed(4)} ETH)`
                  : `${dataset.price} credits (DB only)`;

                return (
                  <div
                    key={dataset.id}
                    className={`flex justify-between items-center p-3 border rounded ${hasOldPricing ? 'border-red-300 bg-red-50' : ''}`}
                  >
                    <div>
                      <div className="font-medium">{dataset.name}</div>
                      <div className="text-sm text-muted-foreground">
                        ID: {dataset.id} | Pool: {dataset.blockchain_pool_id || "None"}
                      </div>
                      <div className={`text-sm ${hasOldPricing ? 'text-red-600 font-medium' : 'text-muted-foreground'}`}>
                        Price: {displayPrice}
                      </div>
                      {hasOldPricing && (
                        <div className="text-xs text-red-600 font-medium">
                          ⚠️ This pool uses old pricing and needs recreation!
                        </div>
                      )}
                    </div>
                    <div className={`text-sm font-medium ${statusColor}`}>
                      {status}
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>

        {/* Blockchain Pools */}
        <Card>
          <CardHeader>
            <CardTitle>Blockchain Pools</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {blockchainPools.map((pool) => (
                <div
                  key={pool.id}
                  className="flex justify-between items-center p-3 border rounded"
                >
                  <div>
                    <div className="font-medium">Pool {pool.id}</div>
                    <div className="text-sm text-muted-foreground">
                      Creator: {pool.creator.slice(0, 10)}... |
                      Price: {pool.pricePerAccess} wei |
                      Contributors: {pool.totalContributors}
                    </div>
                  </div>
                  <div className={`text-sm font-medium ${pool.isActive ? "text-green-600" : "text-red-600"
                    }`}>
                    {pool.isActive ? "Active" : "Inactive"}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
