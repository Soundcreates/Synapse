"use client";

import React, { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { useDataRegistry } from "../../../context/DataRegistryContext";
import { useWallet } from "../../../context/WalletContext";
import { ethers } from "ethers";
import {
  CheckCircle,
  XCircle,
  Users,
  Wallet,
  Settings,
  BarChart3,
  Clock,
  AlertTriangle,
  Eye,
  EyeOff,
  Coins,
  Download,
  RefreshCw,
  ArrowLeft
} from "lucide-react";

type PoolData = {
  id?: number;
  creator: string;
  ipfsHash: string;
  metadataHash: string;
  pricePerAccess: bigint;
  totalContributors: number;
  isActive: boolean;
};

type PendingStake = {
  contributor: string;
  stakeAmount: bigint;
};

export default function DatasetManagePage() {
  const { poolId } = useParams();
  const router = useRouter();
  const { toast } = useToast();
  const { account: walletAddress } = useWallet();
  const {
    getDataPool,
    getContributors,
    acceptStake,
    rejectStake,
    getPendingStake,
    getContributorStake,
    claimRoyalties,
    getPendingRoyalties,
  } = useDataRegistry();

  // State management
  const [poolData, setPoolData] = useState<PoolData | null>(null);
  const [contributors, setContributors] = useState<string[]>([]);
  const [pendingStakes, setPendingStakes] = useState<PendingStake[]>([]);
  const [pendingRoyalties, setPendingRoyalties] = useState<bigint | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [loadingData, setLoadingData] = useState<boolean>(true);
  const [activeTab, setActiveTab] = useState<string>("overview");
  const [manualCheckAddress, setManualCheckAddress] = useState<string>("");

  // Load data
  useEffect(() => {
    const loadData = async () => {
      if (!poolId || !walletAddress) return;

      try {
        setLoadingData(true);
        const numPoolId = Number(poolId);

        // Get pool data
        const pool = await getDataPool(numPoolId);
        if (pool) {
          // Check if user is the owner
          if (pool.creator.toLowerCase() !== walletAddress.toLowerCase()) {
            toast({
              title: "Access Denied",
              description: "You can only manage datasets you own.",
              variant: "destructive",
            });
            router.push("/marketplace");
            return;
          }
          setPoolData(pool);
        }

        // Get contributors
        const contributorsList = await getContributors(numPoolId);
        if (contributorsList) {
          setContributors(contributorsList);
        }

        // Get pending royalties
        const royalties = await getPendingRoyalties(walletAddress);
        setPendingRoyalties(royalties);

        // Load pending stakes (simplified version)
        // Note: Since blockchain doesn't expose enumeration of all addresses,
        // in a real app you'd track these via events or off-chain indexing
        // For now, we'll show instructions for users to check specific addresses
        setPendingStakes([]);

      } catch (error) {
        console.error("Error loading dataset data:", error);
        toast({
          title: "Error Loading Data",
          description: "Failed to load dataset management information.",
          variant: "destructive",
        });
      } finally {
        setLoadingData(false);
      }
    };

    loadData();
  }, [poolId, walletAddress]);

  // Handle accepting a stake
  const handleAcceptStake = async (contributor: string) => {
    if (!poolId) return;

    setLoading(true);
    try {
      const success = await acceptStake(Number(poolId), contributor);
      if (success) {
        // Refresh data
        const contributorsList = await getContributors(Number(poolId));
        if (contributorsList) {
          setContributors(contributorsList);
        }
        // Remove from pending stakes
        setPendingStakes(pendingStakes.filter(stake => stake.contributor !== contributor));
      }
    } catch (error) {
      console.error("Error accepting stake:", error);
    } finally {
      setLoading(false);
    }
  };

  // Handle rejecting a stake
  const handleRejectStake = async (contributor: string) => {
    if (!poolId) return;

    setLoading(true);
    try {
      const success = await rejectStake(Number(poolId), contributor);
      if (success) {
        // Remove from pending stakes
        setPendingStakes(pendingStakes.filter(stake => stake.contributor !== contributor));
      }
    } catch (error) {
      console.error("Error rejecting stake:", error);
    } finally {
      setLoading(false);
    }
  };

  // Handle claiming royalties
  const handleClaimRoyalties = async () => {
    if (!walletAddress) return;

    setLoading(true);
    try {
      const success = await claimRoyalties();
      if (success) {
        // Refresh pending royalties
        const royalties = await getPendingRoyalties(walletAddress);
        setPendingRoyalties(royalties);
      }
    } catch (error) {
      console.error("Error claiming royalties:", error);
    } finally {
      setLoading(false);
    }
  };

  // Handle manual stake checking
  const handleCheckPendingStake = async () => {
    if (!poolId || !manualCheckAddress.trim()) {
      toast({
        title: "Invalid Input",
        description: "Please enter a valid wallet address.",
        variant: "destructive",
      });
      return;
    }

    if (!ethers.isAddress(manualCheckAddress)) {
      toast({
        title: "Invalid Address",
        description: "Please enter a valid Ethereum address.",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);
    try {
      const pendingAmount = await getPendingStake(Number(poolId), manualCheckAddress);

      if (pendingAmount && pendingAmount > 0n) {
        const newStake: PendingStake = {
          contributor: manualCheckAddress,
          stakeAmount: pendingAmount
        };

        // Check if already in list
        const exists = pendingStakes.find(stake =>
          stake.contributor.toLowerCase() === manualCheckAddress.toLowerCase()
        );

        if (!exists) {
          setPendingStakes([...pendingStakes, newStake]);
          toast({
            title: "Pending Stake Found!",
            description: `Found ${ethers.formatUnits(pendingAmount, 18)} SYNTK staked by this address.`,
          });
        } else {
          toast({
            title: "Already Listed",
            description: "This address is already in your pending stakes list.",
            variant: "default",
          });
        }
      } else {
        toast({
          title: "No Pending Stake",
          description: "No pending stake found for this address.",
          variant: "default",
        });
      }

      setManualCheckAddress(""); // Clear input
    } catch (error) {
      console.error("Error checking pending stake:", error);
      toast({
        title: "Check Failed",
        description: "Failed to check pending stake for this address.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  // Handle toggle pool status (simplified - would need contract support)
  const handleTogglePoolStatus = async () => {
    toast({
      title: "Feature Coming Soon",
      description: "Pool activation/deactivation will be available in a future update.",
      variant: "default",
    });
  };

  // Refresh data
  const refreshData = async () => {
    if (!poolId || !walletAddress) return;

    setLoading(true);
    try {
      const numPoolId = Number(poolId);

      // Refresh all data
      const [pool, contributorsList, royalties] = await Promise.all([
        getDataPool(numPoolId),
        getContributors(numPoolId),
        getPendingRoyalties(walletAddress),
      ]);

      if (pool) setPoolData(pool);
      if (contributorsList) setContributors(contributorsList);
      setPendingRoyalties(royalties);

      toast({
        title: "Data Refreshed",
        description: "All dataset information has been updated.",
      });
    } catch (error) {
      console.error("Error refreshing data:", error);
      toast({
        title: "Refresh Failed",
        description: "Failed to refresh dataset information.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  if (loadingData) {
    return (
      <div className="mx-auto max-w-6xl px-4 py-10">
        <div className="animate-fade-up">
          <p className="text-muted-foreground">Loading dataset management...</p>
        </div>
      </div>
    );
  }

  if (!poolData) {
    return (
      <div className="mx-auto max-w-6xl px-4 py-10">
        <div className="animate-fade-up">
          <h1 className="text-3xl font-semibold mb-4">Dataset Not Found</h1>
          <p className="text-muted-foreground">The requested dataset could not be found.</p>
          <Button
            onClick={() => router.push("/marketplace")}
            className="mt-4"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Marketplace
          </Button>
        </div>
      </div>
    );
  }

  const pendingRoyaltiesFormatted = pendingRoyalties
    ? ethers.formatUnits(pendingRoyalties, 18)
    : "0";
  const hasPendingRoyalties = pendingRoyalties && pendingRoyalties > 0n;

  return (
    <div className="mx-auto max-w-6xl px-4 py-10">
      {/* Header */}
      <div className="mb-8 animate-fade-up">
        <Button
          variant="ghost"
          onClick={() => router.push("/marketplace")}
          className="mb-4 hover:bg-gray-100"
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Marketplace
        </Button>
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-semibold mb-2">Dataset Management</h1>
            <p className="text-muted-foreground">
              Manage your dataset, contributors, and earnings
            </p>
          </div>
          <Button onClick={refreshData} disabled={loading} variant="outline">
            <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
        </div>
      </div>

      {/* Tab Navigation */}
      <div className="mb-6 animate-fade-up animation-delay-150">
        <div className="flex space-x-1 bg-black p-1 rounded-lg">
          <button
            onClick={() => setActiveTab("overview")}
            className={`px-4 py-2 rounded-md transition-colors ${activeTab === "overview"
              ? "bg-white text-gray-900 shadow"
              : "text-white "
              }`}
          >
            <BarChart3 className="inline h-4 w-4 mr-2" />
            Overview
          </button>
          <button
            onClick={() => setActiveTab("contributors")}
            className={`px-4 py-2 rounded-md transition-colors ${activeTab === "contributors"
              ? "bg-white text-gray-900 shadow"
              : "text-white "
              }`}
          >
            <Users className="inline h-4 w-4 mr-2" />
            Contributors
          </button>
          <button
            onClick={() => setActiveTab("earnings")}
            className={`px-4 py-2 rounded-md transition-colors ${activeTab === "earnings"
              ? "bg-white text-gray-900 shadow"
              : "text-white "
              }`}
          >
            <Coins className="inline h-4 w-4 mr-2" />
            Earnings
          </button>
          <button
            onClick={() => setActiveTab("settings")}
            className={`px-4 py-2 rounded-md transition-colors ${activeTab === "settings"
              ? "bg-white text-gray-900 shadow"
              : "text-white "
              }`}
          >
            <Settings className="inline h-4 w-4 mr-2" />
            Settings
          </button>
        </div>
      </div>

      {/* Content based on active tab */}
      {activeTab === "overview" && (
        <div className="grid gap-6 animate-fade-up animation-delay-200">
          {/* Dataset Information */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BarChart3 className="h-5 w-5" />
                Dataset Overview
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid md:grid-cols-2 gap-6">
                <div className="space-y-3">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Pool ID:</span>
                    <span className="font-medium">{poolId}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Price per Access:</span>
                    <span className="font-medium">
                      {ethers.formatUnits(poolData.pricePerAccess, 18)} SYNTK
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Total Contributors:</span>
                    <span className="font-medium">{poolData.totalContributors}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Status:</span>
                    <Badge variant={poolData.isActive ? "default" : "secondary"}>
                      {poolData.isActive ? (
                        <>
                          <Eye className="h-3 w-3 mr-1" />
                          Active
                        </>
                      ) : (
                        <>
                          <EyeOff className="h-3 w-3 mr-1" />
                          Inactive
                        </>
                      )}
                    </Badge>
                  </div>
                </div>
                <div className="space-y-3">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">IPFS Hash:</span>
                    <span className="font-mono text-xs break-all">
                      {poolData.ipfsHash.slice(0, 20)}...
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Creator:</span>
                    <span className="font-mono text-xs">
                      {poolData.creator.slice(0, 6)}...{poolData.creator.slice(-4)}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Revenue Share:</span>
                    <span className="font-medium">60% Creator / 40% Contributors</span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Quick Stats */}
          <div className="grid md:grid-cols-3 gap-4">
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="text-2xl font-bold">{contributors.length}</div>
                    <p className="text-sm text-muted-foreground">Active Contributors</p>
                  </div>
                  <Users className="h-8 w-8 text-blue-500" />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="text-2xl font-bold">{pendingStakes.length}</div>
                    <p className="text-sm text-muted-foreground">Pending Stakes</p>
                  </div>
                  <Clock className="h-8 w-8 text-orange-500" />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="text-2xl font-bold">
                      {hasPendingRoyalties ? parseFloat(pendingRoyaltiesFormatted).toFixed(2) : "0"}
                    </div>
                    <p className="text-sm text-muted-foreground">Pending SYNTK</p>
                  </div>
                  <Wallet className="h-8 w-8 text-green-500" />
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      )}

      {activeTab === "contributors" && (
        <div className="grid gap-6 animate-fade-up animation-delay-200">
          {/* Pending Stakes */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Clock className="h-5 w-5" />
                Pending Stakes ({pendingStakes.length})
              </CardTitle>
            </CardHeader>
            <CardContent>
              {/* Manual Check Section */}
              <div className="mb-6 p-4 border border-white bg-black rounded-lg">
                <h4 className="font-medium mb-3 text-white">Check for Pending Stakes</h4>
                <p className="text-sm text-gray-600 mb-3">
                  Enter wallet addresses of potential contributors to check if they have pending stakes.
                </p>
                <div className="flex gap-2">
                  <Input
                    placeholder="Enter wallet address (0x...)"
                    value={manualCheckAddress}
                    onChange={(e) => setManualCheckAddress(e.target.value)}
                    className="flex-1"
                  />
                  <Button
                    onClick={handleCheckPendingStake}
                    disabled={loading || !manualCheckAddress.trim()}
                    size="sm"
                  >
                    {loading ? "Checking..." : "Check Stake"}
                  </Button>
                </div>
              </div>

              {pendingStakes.length === 0 ? (
                <div className="text-center py-8">
                  <Clock className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p className="text-muted-foreground mb-2">No pending stakes detected.</p>
                  <p className="text-sm text-muted-foreground mb-4">
                    Use the check tool above to manually verify if specific addresses have pending stakes.
                  </p>
                  <Alert className="text-left">
                    <AlertTriangle className="h-4 w-4" />
                    <AlertDescription>
                      <strong>Note:</strong> Contributors should inform you of their wallet address after staking tokens.
                    </AlertDescription>
                  </Alert>
                </div>
              ) : (
                <div className="space-y-4">
                  {pendingStakes.map((stake, index) => (
                    <div key={index} className="flex items-center justify-between p-4 border rounded">
                      <div>
                        <div className="font-medium">
                          {stake.contributor.slice(0, 6)}...{stake.contributor.slice(-4)}
                        </div>
                        <div className="text-sm text-muted-foreground">
                          Stake: {ethers.formatUnits(stake.stakeAmount, 18)} SYNTK
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <Button
                          size="sm"
                          onClick={() => handleAcceptStake(stake.contributor)}
                          disabled={loading}
                          className="bg-green-600 hover:bg-green-700"
                        >
                          <CheckCircle className="h-4 w-4 mr-1" />
                          Accept
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleRejectStake(stake.contributor)}
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

          {/* Active Contributors */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="h-5 w-5" />
                Active Contributors ({contributors.length})
              </CardTitle>
            </CardHeader>
            <CardContent>
              {contributors.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <Users className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>No active contributors yet.</p>
                  <p className="text-sm">Contributors will appear here once you accept their stakes.</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {contributors.map((contributor, index) => (
                    <div key={index} className="flex items-center justify-between p-3 border rounded">
                      <div>
                        <div className="font-medium">
                          {contributor.slice(0, 6)}...{contributor.slice(-4)}
                        </div>
                        <div className="text-sm text-muted-foreground">
                          Active Contributor
                        </div>
                      </div>
                      <Badge variant="default">
                        <CheckCircle className="h-3 w-3 mr-1" />
                        Active
                      </Badge>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      )}

      {activeTab === "earnings" && (
        <div className="grid gap-6 animate-fade-up animation-delay-200">
          {/* Pending Royalties */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Wallet className="h-5 w-5" />
                Pending Royalties
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between p-6 bg-black border-2 border-white rounded-lg">
                <div>
                  <div className="text-3xl font-bold text-white">
                    {hasPendingRoyalties ? pendingRoyaltiesFormatted : "0"} SYNTK
                  </div>
                  <p className="text-sm text-muted-foreground">
                    Available to claim from dataset purchases
                  </p>
                </div>
                <Button
                  onClick={handleClaimRoyalties}
                  disabled={loading || !hasPendingRoyalties}
                  className="bg-green-600 hover:bg-green-700"
                >
                  <Download className="h-4 w-4 mr-2" />
                  {loading ? "Claiming..." : "Claim Royalties"}
                </Button>
              </div>

              {!hasPendingRoyalties && (
                <Alert className="mt-4">
                  <Coins className="h-4 w-4" />
                  <AlertDescription>
                    No royalties available yet. Earnings will appear here when users purchase access to your dataset.
                  </AlertDescription>
                </Alert>
              )}
            </CardContent>
          </Card>

          {/* Revenue Information */}
          <Card>
            <CardHeader>
              <CardTitle>Revenue Information</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="grid md:grid-cols-2 gap-4 ">
                  <div className="p-4 border rounded hover:bg-blue-950 transition-all duration-200">
                    <h4 className="font-medium mb-2">Creator Share</h4>
                    <div className="text-2xl font-bold text-blue-600">60%</div>
                    <p className="text-sm text-muted-foreground">
                      You receive 60% of each purchase as the dataset creator
                    </p>
                  </div>
                  <div className="p-4 border rounded hover:bg-green-950 transition-all duration-200">
                    <h4 className="font-medium mb-2">Contributors Share</h4>
                    <div className="text-2xl font-bold text-green-600">40%</div>
                    <p className="text-sm text-muted-foreground">
                      Contributors share 40% equally among all active contributors
                    </p>
                  </div>
                </div>

                <div className="p-4 bg-black border border-gray-800 rounded">
                  <h4 className="font-medium mb-2">Current Price</h4>
                  <div className="text-xl font-bold">
                    {ethers.formatUnits(poolData.pricePerAccess, 18)} SYNTK per purchase
                  </div>
                  <p className="text-sm text-muted-foreground">
                    Your share per purchase: ~{(parseFloat(ethers.formatUnits(poolData.pricePerAccess, 18)) * 0.6).toFixed(2)} SYNTK
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {activeTab === "settings" && (
        <div className="grid gap-6 animate-fade-up animation-delay-200">
          {/* Pool Status */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Settings className="h-5 w-5" />
                Pool Settings
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-center justify-between p-4 border rounded">
                  <div>
                    <h4 className="font-medium">Pool Status</h4>
                    <p className="text-sm text-muted-foreground">
                      {poolData.isActive
                        ? "Dataset is active and accepting purchases/contributions"
                        : "Dataset is inactive and not accepting new activity"}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant={poolData.isActive ? "default" : "secondary"}>
                      {poolData.isActive ? "Active" : "Inactive"}
                    </Badge>
                    <Button
                      onClick={handleTogglePoolStatus}
                      className="bg-black border-white text-white hover:bg-white hover:text-black hover:border-black transition-all duration-200"
                      disabled={loading}
                    >
                      {poolData.isActive ? "Deactivate" : "Activate"}
                    </Button>
                  </div>
                </div>

                <Alert>
                  <AlertTriangle className="h-4 w-4" />
                  <AlertDescription>
                    <strong>Note:</strong> Pool activation/deactivation requires smart contract updates and will be available in a future release.
                  </AlertDescription>
                </Alert>
              </div>
            </CardContent>
          </Card>

          {/* Dataset Information */}
          <Card>
            <CardHeader>
              <CardTitle>Dataset Information</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div>
                  <label className="text-sm font-medium text-muted-foreground">IPFS Hash</label>
                  <div className="mt-1 p-2 bg-black border  rounded font-mono text-sm break-all">
                    {poolData.ipfsHash}
                  </div>
                </div>
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Metadata Hash</label>
                  <div className="mt-1 p-2 bg-black border rounded font-mono text-sm break-all">
                    {poolData.metadataHash}
                  </div>
                </div>
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Creator Address</label>
                  <div className="mt-1 p-2 bg-black border rounded font-mono text-sm">
                    {poolData.creator}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}