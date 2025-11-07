"use client";

import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useDataRegistry } from "../context/DataRegistryContext";
import { useWallet } from "../context/WalletContext";
import { fetchData } from "@/utils/baseUrl";
import { useToast } from "@/hooks/use-toast";
import { validateBlockchainPools } from "@/utils/IndexApi";
import { ethers } from "ethers";
import { isOldPricingSystem, weiToCredits, CREDIT_TO_ETH_RATIO } from "../../utils/pricingMigration";
import { CheckCircle, XCircle, Clock, Users } from "lucide-react";

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

type PendingStake = {
  poolId: number;
  contributor: string;
  stakeAmount: string;
  poolName?: string;
};

export default function AdminPage() {
  const { toast } = useToast();
  const { account: walletAddress } = useWallet();
  const {
    getDataPool,
    getNextPoolId,
    createDataPool,
    getPendingStake,
    acceptStake,
    rejectStake,
    getContributors
  } = useDataRegistry();
  const [datasets, setDatasets] = useState<DatabaseDataset[]>([]);
  const [blockchainPools, setBlockchainPools] = useState<BlockchainPool[]>([]);
  const [nextPoolId, setNextPoolId] = useState<number | null>(null);
  const [loading, setLoading] = useState(false);
  const [pendingStakes, setPendingStakes] = useState<PendingStake[]>([]);
  const [userOwnedPools, setUserOwnedPools] = useState<number[]>([]);
  const [activeTab, setActiveTab] = useState<'admin' | 'contributors'>('admin');

  useEffect(() => {
    fetchDatabaseDatasets();
    fetchBlockchainData();
    if (walletAddress) {
      fetchUserContributorData();
    }
  }, [walletAddress]);

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

  const fetchUserContributorData = async () => {
    if (!walletAddress || !blockchainPools.length) return;

    try {
      // Find pools owned by the user
      const ownedPools = blockchainPools
        .filter(pool => pool.creator.toLowerCase() === walletAddress.toLowerCase())
        .map(pool => pool.id);

      setUserOwnedPools(ownedPools);

      // Check for pending stakes in user's pools
      const allPendingStakes: PendingStake[] = [];

      for (const poolId of ownedPools) {
        const dataset = datasets.find(d => d.blockchain_pool_id === poolId);

        // In a real implementation, you'd have a way to track all addresses that might have pending stakes
        // For now, we'll just check if the current user has a pending stake (for demo purposes)
        // You might want to implement a backend endpoint that tracks pending stakes

        // This is a simplified approach - in reality, you'd need to track pending stakes differently
        const pendingStake = await getPendingStake(poolId, walletAddress);
        if (pendingStake && pendingStake > 0n) {
          allPendingStakes.push({
            poolId,
            contributor: walletAddress,
            stakeAmount: ethers.formatUnits(pendingStake, 18),
            poolName: dataset?.name || `Pool ${poolId}`,
          });
        }
      }

      setPendingStakes(allPendingStakes);
    } catch (error) {
      console.error("Error fetching contributor data:", error);
    }
  };

  const handleAcceptStake = async (poolId: number, contributor: string) => {
    setLoading(true);
    try {
      const success = await acceptStake(poolId, contributor);
      if (success) {
        // Refresh data
        await fetchUserContributorData();
        await fetchBlockchainData();
      }
    } catch (error) {
      console.error("Error accepting stake:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleRejectStake = async (poolId: number, contributor: string) => {
    setLoading(true);
    try {
      const success = await rejectStake(poolId, contributor);
      if (success) {
        // Refresh data
        await fetchUserContributorData();
        await fetchBlockchainData();
      }
    } catch (error) {
      console.error("Error rejecting stake:", error);
    } finally {
      setLoading(false);
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

      {/* Tab Navigation */}
      <div className="mb-6">
        <div className="flex space-x-1 bg-gray-100 p-1 rounded-lg">
          <button
            onClick={() => setActiveTab('admin')}
            className={`px-4 py-2 rounded-md transition-colors ${activeTab === 'admin'
                ? 'bg-white text-gray-900 shadow'
                : 'text-gray-600 hover:text-gray-900'
              }`}
          >
            System Admin
          </button>
          <button
            onClick={() => setActiveTab('contributors')}
            className={`px-4 py-2 rounded-md transition-colors ${activeTab === 'contributors'
                ? 'bg-white text-gray-900 shadow'
                : 'text-gray-600 hover:text-gray-900'
              }`}
          >
            <Users className="inline h-4 w-4 mr-2" />
            Contributor Management
          </button>
        </div>
      </div>

      {activeTab === 'admin' ? (
        // Original Admin Content
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
                  if (walletAddress) {
                    fetchUserContributorData();
                  }
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
      ) : (
        // Contributor Management Content
        <div className="grid gap-6">
          {!walletAddress ? (
            <Card>
              <CardContent className="p-6 text-center">
                <div className="text-muted-foreground">
                  Please connect your wallet to manage contributors for your datasets.
                </div>
              </CardContent>
            </Card>
          ) : (
            <>
              {/* Your Pools */}
              <Card>
                <CardHeader>
                  <CardTitle>Your Dataset Pools</CardTitle>
                </CardHeader>
                <CardContent>
                  {userOwnedPools.length === 0 ? (
                    <div className="text-center py-8 text-muted-foreground">
                      <Users className="h-12 w-12 mx-auto mb-4 opacity-50" />
                      <p>You don't own any dataset pools yet.</p>
                      <p className="text-sm">Create a dataset to start managing contributors.</p>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {userOwnedPools.map(poolId => {
                        const pool = blockchainPools.find(p => p.id === poolId);
                        const dataset = datasets.find(d => d.blockchain_pool_id === poolId);

                        return (
                          <Card key={poolId} className="border-l-4 border-l-blue-500">
                            <CardContent className="p-4">
                              <div className="flex items-center justify-between mb-3">
                                <div>
                                  <h3 className="font-medium">{dataset?.name || `Pool ${poolId}`}</h3>
                                  <p className="text-sm text-muted-foreground">
                                    Pool ID: {poolId} | Contributors: {pool?.totalContributors || 0}
                                  </p>
                                </div>
                                <Badge variant={pool?.isActive ? "default" : "secondary"}>
                                  {pool?.isActive ? "Active" : "Inactive"}
                                </Badge>
                              </div>

                              <div className="text-sm text-muted-foreground">
                                Price: {pool ? `${ethers.formatUnits(pool.pricePerAccess, 18)} SYNTK` : 'N/A'}
                              </div>
                            </CardContent>
                          </Card>
                        );
                      })}
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Pending Stakes */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Clock className="h-5 w-5" />
                    Pending Contributor Stakes
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {pendingStakes.length === 0 ? (
                    <div className="text-center py-8 text-muted-foreground">
                      <Clock className="h-12 w-12 mx-auto mb-4 opacity-50" />
                      <p>No pending stakes at the moment.</p>
                      <p className="text-sm">Stakes will appear here when contributors stake tokens to join your datasets.</p>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {pendingStakes.map((stake, index) => (
                        <div key={index} className="flex items-center justify-between p-4 border rounded">
                          <div>
                            <div className="font-medium">{stake.poolName}</div>
                            <div className="text-sm text-muted-foreground">
                              Contributor: {stake.contributor.slice(0, 6)}...{stake.contributor.slice(-4)}
                            </div>
                            <div className="text-sm">
                              Stake Amount: <span className="font-medium">{stake.stakeAmount} SYNTK</span>
                            </div>
                          </div>

                          <div className="flex gap-2">
                            <Button
                              size="sm"
                              onClick={() => handleAcceptStake(stake.poolId, stake.contributor)}
                              disabled={loading}
                              className="bg-green-600 hover:bg-green-700"
                            >
                              <CheckCircle className="h-4 w-4 mr-1" />
                              Accept
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleRejectStake(stake.poolId, stake.contributor)}
                              disabled={loading}
                              className="border-red-200 text-red-600 hover:bg-red-50"
                            >
                              <XCircle className="h-4 w-4 mr-1" />
                              Reject
                            </Button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Quick Actions for Contributors */}
              <Card>
                <CardHeader>
                  <CardTitle>Quick Actions</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <Button
                    onClick={fetchUserContributorData}
                    variant="outline"
                    className="w-full"
                    disabled={loading}
                  >
                    {loading ? "Refreshing..." : "Refresh Contributor Data"}
                  </Button>

                  <div className="text-sm text-muted-foreground">
                    <p>• Accept stakes to allow contributors to add files to your datasets</p>
                    <p>• Reject stakes to return tokens and deny contribution access</p>
                    <p>• Contributors receive a share of revenue from dataset purchases</p>
                  </div>
                </CardContent>
              </Card>
            </>
          )}
        </div>
      )}
    </div>
  );
}
