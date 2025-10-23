"use client"

import React from "react"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { useToast } from "@/hooks/use-toast"
import { uploadToIPFS } from "@/utils/IndexApi"
import { useDataRegistry } from "../context/DataRegistryContext"
import { useWallet } from "../context/WalletContext"

//importing ethers
import { ethers } from "ethers";
import { fetchData } from "@/utils/baseUrl"


type dataSetBackendPayload = {
  name: string,
  blockchain_pool_id: string | number | null | undefined,
  description?: string,
  ipfs_hash: string,
  file_size: number,
  file_type: string,
  owner_address: string,
  price: number
}

export default function UploadPage() {
  const { toast } = useToast()
  const { account: walletAddress } = useWallet();
  const { createDataPool } = useDataRegistry();
  const [file, setFile] = React.useState<File | null>(null)
  const [name, setName] = React.useState("")
  const [price, setPrice] = React.useState<number>(10)
  const [loading, setLoading] = React.useState(false)

  //grabbing users wallet address to send to backend
  const { account } = useWallet();


  //first we will send teh file to pianta
  //grab its cid
  //then create  the pool onchain
  async function onSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!file) {
      toast({
        title: "Select a file",
        description: "Please choose a file to upload.",
        variant: "destructive"
      })
      return
    }

    if (!name.trim()) {
      toast({
        title: "Dataset name required",
        description: "Please provide a name for your dataset.",
        variant: "destructive"
      })
      return
    }

    setLoading(true)
    try {
      //uploading the actual file to ipfs
      console.log("Starting file upload to IPFS...");
      const uploadResult = await uploadToIPFS(file);
      console.log("Upload result:", uploadResult);
      const dataCid = uploadResult.cid;

      if (!dataCid) {
        throw new Error("Failed to get CID from IPFS upload");
      }

      console.log("Data CID received:", dataCid);

      toast({
        title: "File uploaded to IPFS",
        description: "Your file has been successfully uploaded to IPFS.",
      })

      const owner = walletAddress ?? "anonymous"

      //creating the metadata object 
      const metadata = {
        name: name,
        description: `Dataset: ${name}`,
        price: price,
        uploadedAt: new Date().toISOString(),
        fileType: file.type,
        owner: owner,
        cid: dataCid,
      }

      const metadataBlob = new Blob([JSON.stringify(metadata)], { type: "application/json" });
      const metadataFile = new File([metadataBlob], "metadata.json", { type: "application/json" });
      const metadataUploadResult = await uploadToIPFS(metadataFile);
      const metadataHash = metadataUploadResult.cid;

      if (!metadataHash) {
        throw new Error("Failed to get metadata CID from IPFS upload");
      }

      console.log("Metadata CID received:", metadataHash);

      // 3. Create dataset in database FIRST (without blockchain ID)
      console.log("Received datacid is: ", dataCid);
      let backendPayload: dataSetBackendPayload = {
        name: name,
        blockchain_pool_id: null, // Start with null
        description: `Dataset: ${name}`,
        ipfs_hash: dataCid,
        file_size: file.size,
        file_type: file.type,
        owner_address: account || "anonymous",
        price: price
      }
      console.log("Contacting the backend to create dataset record:", backendPayload);
      const backendResponse = await fetchData.post('/datasets', backendPayload);

      if (!backendResponse || backendResponse.status !== 201) {
        throw new Error("Failed to create dataset in database");
      }

      const databaseId = backendResponse.data.data?.id || backendResponse.data.id; // Handle different response formats
      console.log("Dataset created in database with ID:", databaseId);


      // 4. Create pool on blockchain
      const pool = await createDataPool(dataCid, metadataHash, price.toString());
      console.log("Pool id has been grabbed: ", pool?.poolId);

      if (pool && pool.success && pool.poolId) {
        // 5. Update database record with blockchain pool ID
        const updateResponse = await fetchData.patch(`/datasets/${databaseId}`, {
          blockchain_pool_id: pool.poolId
        });

        if (updateResponse && updateResponse.status === 200) {
          console.log("Backend dataset has been updated!");
          toast({
            title: "Dataset Created Successfully!",
            description: `"${name}" uploaded with Database ID: ${databaseId}, Blockchain Pool ID: ${pool.poolId}`,
          })
          window.location.href = "/dashboard";
        }
      } else {
        // Blockchain creation failed, but we have database record
        toast({
          title: "Partial Success",
          description: `Dataset saved to database (ID: ${databaseId}) but blockchain creation failed. You can retry later.`,
          variant: "destructive"
        })
      }

      setFile(null)
      setName("")
      setPrice(10)
    } catch (err: any) {
      console.error("Upload error:", err)
      toast({
        title: "Upload failed",
        description: err?.message || "Something went wrong while uploading your dataset",
        variant: "destructive"
      })
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="mx-auto max-w-3xl px-4 py-10">
      <h1 className="mb-6 text-3xl font-semibold animate-fade-up">Upload Dataset</h1>

      <Card className="animate-fade-up animation-delay-150">
        <CardContent className="p-6">
          <form className="grid gap-4" onSubmit={onSubmit}>
            <div className="grid gap-2">
              <label className="text-sm font-medium">Dataset name</label>
              <Input
                placeholder="e.g. City Traffic Counts 2019-2024"
                value={name}
                onChange={(e) => setName(e.target.value)}
              />
            </div>

            <div className="grid gap-2">
              <label className="text-sm font-medium">Price (credits)</label>
              <Input
                type="number"
                min={0}
                value={price}
                onChange={(e) => setPrice(Number.parseFloat(e.target.value))}
              />
            </div>

            <div className="grid gap-2">
              <label className="text-sm font-medium">File</label>
              <Input type="file" onChange={(e) => setFile(e.target.files?.[0] || null)} />
            </div>

            <div className="pt-2">
              <Button type="submit" disabled={loading}>
                {loading ? "Uploading…" : "Upload & Create Pool"}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>

      <p className="mt-4 text-sm text-muted-foreground animate-fade animation-delay-300">
        This is a simulation. Files are not actually uploaded; actions use mocked async APIs.
      </p>
    </div>
  )
}
