"use client";

import React, { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { useDataRegistry } from "../../context/DataRegistryContext";
import { useWallet } from "../../context/WalletContext";
import { ethers } from "ethers";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { InfoIcon, CheckCircle, XCircle, Clock, Upload, Plus, Trash2 } from "lucide-react";
import { uploadToIPFS } from "@/utils/IndexApi";

type PoolData = {
  id?: number;
  creator: string;
  ipfsHash: string;
  metadataHash: string;
  pricePerAccess: bigint;
  totalContributors: number;
  isActive: boolean;
};

type ContributionFile = {
  id: string;
  file: File;
  name: string;
  description: string;
};

export default function ContributePage() {
  const { poolId } = useParams();
  const router = useRouter();
  const { toast } = useToast();
  const { account: walletAddress } = useWallet();
  const {
    contributorStake,
    withdrawStake,
    getPendingStake,
    getContributorStake,
    getDataPool,
    getContributors,
  } = useDataRegistry();

  // State management
  const [poolData, setPoolData] = useState<PoolData | null>(null);
  const [stakeAmount, setStakeAmount] = useState<string>("10");
  const [pendingStake, setPendingStake] = useState<bigint | null>(null);
  const [acceptedStake, setAcceptedStake] = useState<bigint | null>(null);
  const [isContributor, setIsContributor] = useState<boolean>(false);
  const [loading, setLoading] = useState<boolean>(false);
  const [loadingData, setLoadingData] = useState<boolean>(true);
  const [contributionFiles, setContributionFiles] = useState<ContributionFile[]>([]);
  const [uploadingFiles, setUploadingFiles] = useState<boolean>(false);

  // Load pool data and user contribution status
  useEffect(() => {
    const loadData = async () => {
      if (!poolId || !walletAddress) return;

      try {
        setLoadingData(true);
        const numPoolId = Number(poolId);

        // Get pool data
        const pool = await getDataPool(numPoolId);
        if (pool) {
          setPoolData(pool);
        }

        // Get pending stake
        const pending = await getPendingStake(numPoolId, walletAddress);
        setPendingStake(pending);

        // Get accepted stake
        const accepted = await getContributorStake(numPoolId, walletAddress);
        setAcceptedStake(accepted);

        // Check if user is already a contributor
        const contributors = await getContributors(numPoolId);
        if (contributors && contributors.includes(walletAddress)) {
          setIsContributor(true);
        }
      } catch (error) {
        console.error("Error loading contribution data:", error);
        toast({
          title: "Error Loading Data",
          description: "Failed to load contribution information.",
          variant: "destructive",
        });
      } finally {
        setLoadingData(false);
      }
    };

    loadData();
  }, [poolId, walletAddress]);

  // Handle stake submission
  const handleStakeSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!walletAddress || !poolId) {
      toast({
        title: "Wallet Not Connected",
        description: "Please connect your wallet to contribute.",
        variant: "destructive",
      });
      return;
    }

    if (!stakeAmount || parseFloat(stakeAmount) <= 0) {
      toast({
        title: "Invalid Stake Amount",
        description: "Please enter a valid stake amount greater than 0.",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);
    try {
      const success = await contributorStake(stakeAmount, Number(poolId));
      if (success) {
        // Refresh pending stake
        const newPending = await getPendingStake(Number(poolId), walletAddress);
        setPendingStake(newPending);
        setStakeAmount("10"); // Reset form
      }
    } catch (error) {
      console.error("Error submitting stake:", error);
    } finally {
      setLoading(false);
    }
  };

  // Handle stake withdrawal
  const handleWithdrawStake = async () => {
    if (!walletAddress || !poolId) {
      toast({
        title: "Wallet Not Connected",
        description: "Please connect your wallet to withdraw stake.",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);
    try {
      const success = await withdrawStake(Number(poolId));
      if (success) {
        // Refresh pending stake
        const newPending = await getPendingStake(Number(poolId), walletAddress);
        setPendingStake(newPending);
      }
    } catch (error) {
      console.error("Error withdrawing stake:", error);
    } finally {
      setLoading(false);
    }
  };

  // Add new contribution file
  const addContributionFile = () => {
    const newFile: ContributionFile = {
      id: Date.now().toString(),
      file: new File([], ""),
      name: "",
      description: "",
    };
    setContributionFiles([...contributionFiles, newFile]);
  };

  // Remove contribution file
  const removeContributionFile = (id: string) => {
    setContributionFiles(contributionFiles.filter(file => file.id !== id));
  };

  // Update contribution file
  const updateContributionFile = (id: string, updates: Partial<ContributionFile>) => {
    setContributionFiles(contributionFiles.map(file =>
      file.id === id ? { ...file, ...updates } : file
    ));
  };

  // Handle file uploads
  const handleFileUpload = async () => {
    if (contributionFiles.length === 0) {
      toast({
        title: "No Files Selected",
        description: "Please add at least one file to contribute.",
        variant: "destructive",
      });
      return;
    }

    // Validate all files
    for (const fileData of contributionFiles) {
      if (!fileData.file.size || !fileData.name.trim()) {
        toast({
          title: "Incomplete File Data",
          description: "Please ensure all files have names and are selected.",
          variant: "destructive",
        });
        return;
      }
    }

    setUploadingFiles(true);
    try {
      const uploadPromises = contributionFiles.map(async (fileData) => {
        // Create metadata for this contribution
        const metadata = {
          name: fileData.name,
          description: fileData.description,
          contributor: walletAddress,
          poolId: poolId,
          uploadedAt: new Date().toISOString(),
          fileType: fileData.file.type,
        };

        // Upload file to IPFS
        const uploadResult = await uploadToIPFS(fileData.file);

        // Upload metadata to IPFS
        const metadataBlob = new Blob([JSON.stringify(metadata)], {
          type: "application/json",
        });
        const metadataFile = new File([metadataBlob], "contribution-metadata.json", {
          type: "application/json",
        });
        const metadataUploadResult = await uploadToIPFS(metadataFile);

        return {
          fileName: fileData.name,
          description: fileData.description,
          ipfsHash: uploadResult.cid,
          metadataHash: metadataUploadResult.cid,
        };
      });

      const uploadResults = await Promise.all(uploadPromises);

      toast({
        title: "Files Uploaded Successfully!",
        description: `${uploadResults.length} files have been uploaded to IPFS and added to the dataset.`,
      });

      // Clear the form
      setContributionFiles([]);

    } catch (error) {
      console.error("Error uploading files:", error);
      toast({
        title: "Upload Failed",
        description: "Failed to upload one or more files. Please try again.",
        variant: "destructive",
      });
    } finally {
      setUploadingFiles(false);
    }
  };

  if (loadingData) {
    return (
      <div className="mx-auto max-w-4xl px-4 py-10">
        <div className="animate-fade-up">
          <p className="text-muted-foreground">Loading contribution data...</p>
        </div>
      </div>
    );
  }

  if (!poolData) {
    return (
      <div className="mx-auto max-w-4xl px-4 py-10">
        <div className="animate-fade-up">
          <h1 className="text-3xl font-semibold mb-4">Dataset Not Found</h1>
          <p className="text-muted-foreground">The requested dataset could not be found.</p>
          <Button
            onClick={() => router.push("/marketplace")}
            className="mt-4"
          >
            Back to Marketplace
          </Button>
        </div>
      </div>
    );
  }

  const pendingStakeFormatted = pendingStake ? ethers.formatUnits(pendingStake, 18) : "0";
  const acceptedStakeFormatted = acceptedStake ? ethers.formatUnits(acceptedStake, 18) : "0";
  const hasPendingStake = pendingStake && pendingStake > 0n;
  const hasAcceptedStake = acceptedStake && acceptedStake > 0n;

  return (
    <div className="mx-auto max-w-4xl px-4 py-10">
      {/* Header */}
      <div className="mb-8 animate-fade-up">
        <Button
          variant="ghost"
          onClick={() => router.push("/marketplace")}
          className="mb-4 hover:bg-gray-100"
        >
          ← Back to Marketplace
        </Button>
        <h1 className="text-3xl font-semibold mb-2">Contribute to Dataset</h1>
        <p className="text-muted-foreground">
          Stake tokens to become a contributor and add valuable data to this dataset.
        </p>
      </div>

      {/* Pool Information */}
      <Card className="mb-6 animate-fade-up animation-delay-150">
        <CardContent className="p-6">
          <h2 className="text-xl font-semibold mb-4">Dataset Information</h2>
          <div className="grid gap-3 text-sm">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Creator:</span>
              <span className="font-mono">{poolData.creator}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Price per Access:</span>
              <span>{ethers.formatUnits(poolData.pricePerAccess, 18)} SYNTK</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Total Contributors:</span>
              <span>{poolData.totalContributors}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Status:</span>
              <Badge variant={poolData.isActive ? "default" : "secondary"}>
                {poolData.isActive ? "Active" : "Inactive"}
              </Badge>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Contribution Status */}
      <Card className="mb-6 animate-fade-up animation-delay-200">
        <CardContent className="p-6">
          <h2 className="text-xl font-semibold mb-4">Your Contribution Status</h2>

          {hasAcceptedStake ? (
            <Alert className="mb-4">
              <CheckCircle className="h-4 w-4" />
              <AlertDescription>
                <strong>Accepted Contributor!</strong> You have staked {acceptedStakeFormatted} SYNTK tokens and can now upload files to this dataset.
              </AlertDescription>
            </Alert>
          ) : hasPendingStake ? (
            <div className="space-y-4">
              <Alert className="mb-4">
                <Clock className="h-4 w-4" />
                <AlertDescription>
                  <strong>Stake Pending!</strong> You have staked {pendingStakeFormatted} SYNTK tokens. Waiting for creator approval.
                </AlertDescription>
              </Alert>

              {/* Withdraw Stake Option */}
              <div className="flex items-center justify-between p-4 border border-orange-200 bg-orange-50 rounded-lg">
                <div>
                  <h4 className="font-medium text-orange-900">Want to withdraw your stake?</h4>
                  <p className="text-sm text-orange-700">
                    You can withdraw your {pendingStakeFormatted} SYNTK tokens anytime before approval.
                  </p>
                </div>
                <Button
                  onClick={handleWithdrawStake}
                  disabled={loading}
                  variant="outline"
                  className="border-orange-300 text-orange-700 hover:bg-orange-100"
                >
                  {loading ? "Withdrawing..." : "Withdraw Stake"}
                </Button>
              </div>
            </div>
          ) : (
            <Alert className="mb-4">
              <InfoIcon className="h-4 w-4" />
              <AlertDescription>
                You haven't staked any tokens yet. Stake tokens to become a contributor.
              </AlertDescription>
            </Alert>
          )}

          {/* Stake Form (only show if no pending or accepted stake) */}
          {!hasPendingStake && !hasAcceptedStake && (
            <form onSubmit={handleStakeSubmit} className="grid gap-4">
              <div className="grid gap-2">
                <label className="text-sm font-medium">Stake Amount (SYNTK tokens)</label>
                <Input
                  type="number"
                  min="1"
                  step="0.1"
                  value={stakeAmount}
                  onChange={(e) => setStakeAmount(e.target.value)}
                  placeholder="Enter amount to stake"
                />
                <p className="text-xs text-muted-foreground">
                  Higher stakes may increase your chances of acceptance and revenue share.
                </p>
              </div>
              <Button type="submit" disabled={loading} className="w-fit">
                {loading ? "Staking..." : "Submit Stake"}
              </Button>
            </form>
          )}
        </CardContent>
      </Card>

      {/* File Upload Section (only show for accepted contributors) */}
      {hasAcceptedStake && (
        <Card className="animate-fade-up animation-delay-300">
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-semibold">Contribute Files</h2>
              <Button onClick={addContributionFile} variant="outline" size="sm">
                <Plus className="h-4 w-4 mr-2" />
                Add File
              </Button>
            </div>

            {contributionFiles.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <Upload className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>No files added yet. Click "Add File" to contribute data to this dataset.</p>
              </div>
            ) : (
              <div className="space-y-4">
                {contributionFiles.map((fileData, index) => (
                  <Card key={fileData.id} className="p-4">
                    <div className="grid gap-4">
                      <div className="flex items-center justify-between">
                        <h4 className="font-medium">File {index + 1}</h4>
                        <Button
                          onClick={() => removeContributionFile(fileData.id)}
                          variant="ghost"
                          size="sm"
                          className="text-red-500 hover:text-red-700"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>

                      <div className="grid gap-3">
                        <div>
                          <label className="text-sm font-medium">File Name</label>
                          <Input
                            value={fileData.name}
                            onChange={(e) => updateContributionFile(fileData.id, { name: e.target.value })}
                            placeholder="Enter descriptive file name"
                          />
                        </div>

                        <div>
                          <label className="text-sm font-medium">Description</label>
                          <Textarea
                            value={fileData.description}
                            onChange={(e) => updateContributionFile(fileData.id, { description: e.target.value })}
                            placeholder="Describe what this file contains..."
                            className="min-h-20"
                          />
                        </div>

                        <div>
                          <label className="text-sm font-medium">Select File</label>
                          <Input
                            type="file"
                            onChange={(e) => {
                              const file = e.target.files?.[0];
                              if (file) {
                                updateContributionFile(fileData.id, { file });
                              }
                            }}
                          />
                        </div>
                      </div>
                    </div>
                  </Card>
                ))}

                <div className="pt-4">
                  <Button
                    onClick={handleFileUpload}
                    disabled={uploadingFiles}
                    className="w-full"
                  >
                    {uploadingFiles ? "Uploading..." : `Upload ${contributionFiles.length} File(s)`}
                  </Button>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      <p className="mt-6 text-sm text-muted-foreground animate-fade animation-delay-400">
        By contributing to this dataset, you agree to the platform's terms and conditions.
        Contributors receive a share of revenue from dataset sales.
      </p>
    </div>
  );
}