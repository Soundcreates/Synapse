"use client";

import React from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { uploadToIPFS } from "@/utils/IndexApi";
import { useDataRegistry } from "../context/DataRegistryContext";
import { useWallet } from "../context/WalletContext";
import { Plus, Trash2, Upload } from "lucide-react";

//importing ethers
import { ethers } from "ethers";
import { fetchData } from "@/utils/baseUrl";
import { CREDIT_TO_ETH_RATIO } from "../../utils/pricingMigration";

type dataSetBackendPayload = {
  name: string;
  blockchain_pool_id: string | number | null | undefined;
  description?: string;
  ipfs_hash: string;
  file_size: number;
  file_type: string;
  owner_address: string;
  price: number;
};

type DatasetFile = {
  id: string;
  file: File | null;
  name: string;
  description: string;
};

export default function UploadPage() {
  const { toast } = useToast();
  const { account: walletAddress } = useWallet();
  const { createDataPool } = useDataRegistry();
  const [datasetName, setDatasetName] = React.useState("");
  const [datasetDescription, setDatasetDescription] = React.useState("");
  const [price, setPrice] = React.useState<number>(1);
  const [loading, setLoading] = React.useState(false);
  const [files, setFiles] = React.useState<DatasetFile[]>([
    {
      id: "1",
      file: null,
      name: "",
      description: "",
    }
  ]);

  //grabbing users wallet address to send to backend
  const { account } = useWallet();

  // Add new file input
  const addFileInput = () => {
    const newFile: DatasetFile = {
      id: Date.now().toString(),
      file: null,
      name: "",
      description: "",
    };
    setFiles([...files, newFile]);
  };

  // Remove file input
  const removeFileInput = (id: string) => {
    if (files.length > 1) {
      setFiles(files.filter(f => f.id !== id));
    }
  };

  // Update file data
  const updateFile = (id: string, updates: Partial<DatasetFile>) => {
    setFiles(files.map(f => f.id === id ? { ...f, ...updates } : f));
  };

  //first we will send the files to pinata
  //grab their cids
  //then create the pool onchain
  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();

    // Validate files
    const validFiles = files.filter(f => f.file !== null);
    if (validFiles.length === 0) {
      toast({
        title: "Select at least one file",
        description: "Please choose at least one file to upload.",
        variant: "destructive",
      });
      return;
    }

    if (!datasetName.trim()) {
      toast({
        title: "Dataset name required",
        description: "Please provide a name for your dataset.",
        variant: "destructive",
      });
      return;
    }

    // Validate that all files have names
    for (const fileData of validFiles) {
      if (!fileData.name.trim()) {
        toast({
          title: "File names required",
          description: "Please provide names for all files.",
          variant: "destructive",
        });
        return;
      }
    }

    setLoading(true);
    try {
      toast({
        title: "Uploading Files",
        description: `Uploading ${validFiles.length} files to IPFS...`,
      });

      // Upload all files to IPFS
      const uploadPromises = validFiles.map(async (fileData) => {
        const uploadResult = await uploadToIPFS(fileData.file!);
        return {
          name: fileData.name,
          description: fileData.description,
          cid: uploadResult.cid,
          size: fileData.file!.size,
          type: fileData.file!.type,
        };
      });

      const uploadResults = await Promise.all(uploadPromises);
      console.log("All files uploaded:", uploadResults);

      // Create combined metadata
      const metadata = {
        datasetName: datasetName,
        description: datasetDescription,
        price: price,
        uploadedAt: new Date().toISOString(),
        owner: walletAddress ?? "anonymous",
        files: uploadResults,
        totalFiles: uploadResults.length,
        totalSize: uploadResults.reduce((sum, file) => sum + file.size, 0),
      };

      const metadataBlob = new Blob([JSON.stringify(metadata, null, 2)], {
        type: "application/json",
      });
      const metadataFile = new File([metadataBlob], "dataset-metadata.json", {
        type: "application/json",
      });
      const metadataUploadResult = await uploadToIPFS(metadataFile);
      const metadataHash = metadataUploadResult.cid;

      if (!metadataHash) {
        throw new Error("Failed to get metadata CID from IPFS upload");
      }

      console.log("Metadata CID received:", metadataHash);

      toast({
        title: "Files uploaded to IPFS",
        description: "Creating dataset record in database...",
      });

      // Create dataset in database FIRST (without blockchain ID)
      // Use the first file's CID as the main IPFS hash
      const mainFileCid = uploadResults[0].cid;
      let backendPayload: dataSetBackendPayload = {
        name: datasetName,
        blockchain_pool_id: null, // Start with null
        description: datasetDescription,
        ipfs_hash: mainFileCid, // Main file CID
        file_size: uploadResults.reduce((sum, file) => sum + file.size, 0),
        file_type: uploadResults.length > 1 ? "multi-file" : uploadResults[0].type,
        owner_address: account || "anonymous",
        price: price,
      };

      console.log("Contacting the backend to create dataset record:", backendPayload);
      const backendResponse = await fetchData.post("/datasets", backendPayload);

      if (!backendResponse || backendResponse.status !== 201) {
        throw new Error("Failed to create dataset in database");
      }

      const databaseId = backendResponse.data.data?.id || backendResponse.data.id;
      console.log("Dataset created in database with ID:", databaseId);

      toast({
        title: "Creating Blockchain Pool",
        description: "Creating smart contract pool...",
      });

      // Create pool on blockchain
      const pool = await createDataPool(
        metadataHash, // Use metadata hash as main IPFS hash
        metadataHash,
        price.toString(),
      );
      console.log("Pool id has been grabbed: ", pool?.poolId);

      if (pool && pool.success && pool.poolId) {
        // Update database record with blockchain pool ID
        const updateResponse = await fetchData.patch(
          `/datasets/${databaseId}`,
          {
            blockchain_pool_id: pool.poolId,
            tx_hash: pool.tx_hash,
          },
        );

        if (updateResponse && updateResponse.status === 200) {
          console.log("Backend dataset has been updated!");
          toast({
            title: "Dataset Created Successfully!",
            description: `"${datasetName}" with ${validFiles.length} files uploaded. Database ID: ${databaseId}, Blockchain Pool ID: ${pool.poolId}`,
          });
          window.location.href = "/dashboard";
        }
      } else {
        // Blockchain creation failed, but we have database record
        toast({
          title: "Partial Success",
          description: `Dataset saved to database (ID: ${databaseId}) but blockchain creation failed. You can retry later.`,
          variant: "destructive",
        });
      }

      // Reset form
      setFiles([{ id: "1", file: null, name: "", description: "" }]);
      setDatasetName("");
      setDatasetDescription("");
      setPrice(1);
    } catch (err: any) {
      console.error("Upload error:", err);
      toast({
        title: "Upload failed",
        description: err?.message || "Something went wrong while uploading your dataset",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="mx-auto max-w-4xl px-4 py-10">
      <h1 className="mb-6 text-3xl font-semibold animate-fade-up">
        Upload Dataset
      </h1>

      <div className="grid gap-6">
        {/* Dataset Information */}
        <Card className="animate-fade-up animation-delay-150">
          <CardContent className="p-6">
            <h2 className="text-xl font-semibold mb-4">Dataset Information</h2>
            <div className="grid gap-4">
              <div className="grid gap-2">
                <label className="text-sm font-medium">Dataset name</label>
                <Input
                  placeholder="e.g. City Traffic Counts 2019-2024"
                  value={datasetName}
                  onChange={(e) => setDatasetName(e.target.value)}
                />
              </div>

              <div className="grid gap-2">
                <label className="text-sm font-medium">Description</label>
                <Textarea
                  placeholder="Describe your dataset..."
                  value={datasetDescription}
                  onChange={(e) => setDatasetDescription(e.target.value)}
                  className="min-h-20"
                />
              </div>

              <div className="grid gap-2">
                <label className="text-sm font-medium">Price (SYNTK tokens)</label>
                <Input
                  type="number"
                  min={1}
                  step={1}
                  value={price}
                  onChange={(e) => setPrice(Number.parseFloat(e.target.value))}
                  placeholder="e.g. 2 (will cost 2 SYNTK tokens to purchase)"
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Files Section */}
        <Card className="animate-fade-up animation-delay-200">
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-semibold">Files</h2>
              <Button onClick={addFileInput} variant="outline" size="sm">
                <Plus className="h-4 w-4 mr-2" />
                Add File
              </Button>
            </div>

            {files.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <Upload className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>No files added yet. Click "Add File" to start.</p>
              </div>
            ) : (
              <div className="space-y-4">
                {files.map((fileData, index) => (
                  <Card key={fileData.id} className="p-4 border-dashed">
                    <div className="grid gap-4">
                      <div className="flex items-center justify-between">
                        <h4 className="font-medium">File {index + 1}</h4>
                        {files.length > 1 && (
                          <Button
                            onClick={() => removeFileInput(fileData.id)}
                            variant="ghost"
                            size="sm"
                            className="text-red-500 hover:text-red-700"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        )}
                      </div>

                      <div className="grid gap-3 md:grid-cols-2">
                        <div>
                          <label className="text-sm font-medium">File Name</label>
                          <Input
                            value={fileData.name}
                            onChange={(e) => updateFile(fileData.id, { name: e.target.value })}
                            placeholder="Enter descriptive file name"
                          />
                        </div>

                        <div>
                          <label className="text-sm font-medium">Select File</label>
                          <Input
                            type="file"
                            onChange={(e) => {
                              const file = e.target.files?.[0];
                              if (file) {
                                updateFile(fileData.id, { file });
                              }
                            }}
                          />
                        </div>
                      </div>

                      <div>
                        <label className="text-sm font-medium">Description (Optional)</label>
                        <Textarea
                          value={fileData.description}
                          onChange={(e) => updateFile(fileData.id, { description: e.target.value })}
                          placeholder="Describe what this file contains..."
                          className="min-h-16"
                        />
                      </div>

                      {fileData.file && (
                        <div className="text-sm text-muted-foreground">
                          Size: {(fileData.file.size / 1024).toFixed(2)} KB | Type: {fileData.file.type || 'Unknown'}
                        </div>
                      )}
                    </div>
                  </Card>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Submit Section */}
        <Card className="animate-fade-up animation-delay-300">
          <CardContent className="p-6">
            <form onSubmit={onSubmit}>
              <Button type="submit" disabled={loading} size="lg" className="w-full">
                {loading ? "Uploading…" : `Upload Dataset (${files.filter(f => f.file).length} files)`}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>

      <p className="mt-6 text-sm text-muted-foreground animate-fade animation-delay-400">
        Upload multiple files to create comprehensive datasets. Contributors can add more files later if approved.
      </p>
    </div>
  );
}
