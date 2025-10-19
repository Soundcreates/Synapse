"use client"

import React from "react"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { useToast } from "@/hooks/use-toast"
import { uploadToIPFS } from "@/utils/IndexApi"
import { useLedger } from "@/contexts/ledger-context"
import { useDataRegistry } from "../context/DataRegistryContext"
import { useWallet } from "../context/WalletContext"

//importing ethers
import { ethers } from "ethers";

export default function UploadPage() {
  const { toast } = useToast()
  const { account: walletAddress } = useWallet();
  const { createDataPool } = useDataRegistry();
  const [file, setFile] = React.useState<File | null>(null)
  const [name, setName] = React.useState("")
  const [price, setPrice] = React.useState<number>(10)
  const [loading, setLoading] = React.useState(false)


  //first we will send teh file to pianta
  //grab its cid
  //then create  the pool onchain
  async function onSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!file) {
      toast({ title: "Select a file", description: "Please choose a file to upload." })
      return
    }
    setLoading(true)
    try {
      //uploading the actual file to ipfs
      const { cid: dataCid } = await uploadToIPFS(file)
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
      const { cid: metadataHash } = await uploadToIPFS(metadataFile)

      const formattedPrice = await ethers.parseUnits(price.toString(), 18);
      //converting metadata to a blob and uploading
      const pool = await createDataPool(dataCid, metadataHash, formattedPrice.toString());
      if (pool.success) {
        toast({
          title: "Pool created",
          description: `Created by ${name}, ${walletAddress ? "" : " • connect a wallet to claim ownership next time"}`,
        })
      }

      setFile(null)
      setName("")
      setPrice(10)
    } catch (err: any) {
      toast({ title: "Upload failed", description: err?.message || "Something went wrong" })
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
