"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { useToast } from "@/hooks/use-toast"

import { ethers } from "ethers"

// Import your contract ABIs
import TokenMarketplaceABI from "@/contractData/TokenMarketplace.json"
import SynTKABI from "@/contractData/SynTK.json"
import { useWallet } from "../context/WalletContext"
import { useMkp } from "../context/TokenMarketplaceContext"

// Extend Window interface for ethereum
declare global {
  interface Window {
    ethereum?: any
  }
}

export default function BuyTokensPage() {
  const [amount, setAmount] = useState("")
  const [loading, setLoading] = useState(false)

  const { account: walletAddress } = useWallet();

  const { toast } = useToast()

  const { buyTokens, balance } = useMkp();


  const handleBuyTokens = async () => {
    setLoading(true);
    if (!walletAddress) {
      throw new Error("Wallet not connected");
      setLoading(false);
    }

    try {
      const tokenAmount = amount;
      await buyTokens(tokenAmount, walletAddress);
    } catch (err) {
      console.error("Error buying tokens:", err);
      toast({
        title: "Transaction Failed",
        description: "There was an error processing your transaction. Please try again.",
        variant: "destructive",
      });
    }
  }






  return (
    <div className="mx-auto max-w-2xl px-4 py-10">
      <div className="mb-8 text-center" data-aos="fade-up">
        <h1 className="text-3xl font-bold">Buy SynTK Tokens</h1>
        <p className="mt-2 text-muted-foreground">
          Purchase SynTK tokens to access premium datasets and features
        </p>
      </div>

      <div className="space-y-6">
        {/* Token Balance Card */}
        <Card data-aos="fade-up" data-aos-delay="100">
          <CardHeader>
            <CardTitle>Your Token Balance</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {balance} SynTK
            </div>
            <p className="text-sm text-muted-foreground mt-1">
              Current balance in your connected wallet
            </p>
          </CardContent>
        </Card>

        {/* Purchase Form */}
        <Card data-aos="fade-up" data-aos-delay="200">
          <CardHeader>
            <CardTitle>Purchase Tokens</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="amount">Amount of SynTK Tokens</Label>
              <Input
                id="amount"
                type="number"
                placeholder="Enter amount (e.g., 100)"
                value={amount}
                onChange={(e) => setAmount((e.target.value).toString())}
                min="0"
                step="0.1"
              />
            </div>

            <div className="rounded-lg border p-4 bg-muted/50">
              <div className="flex justify-between items-center mb-2">
                <span className="text-sm text-muted-foreground">You will receive:</span>
                <span className="font-medium">{amount || "0"} SynTK</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-muted-foreground">Estimated cost:</span>
                <span className="font-medium">{amount ? `${parseFloat(amount) * 0.0001} ETH` : "0 ETH"}</span>
              </div>
            </div>

            <Button
              onClick={handleBuyTokens}
              disabled={loading || !walletAddress}
              className="w-full"
              size="lg"
            >
              {loading ? "Processing..." : "Buy Tokens"}
            </Button>

            {!walletAddress && (
              <p className="text-center text-sm text-muted-foreground">
                Please connect your wallet to purchase tokens
              </p>
            )}
          </CardContent>
        </Card>

        {/* Information Card */}
        <Card data-aos="fade-up" data-aos-delay="300">
          <CardHeader>
            <CardTitle>How it Works</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex items-start space-x-3">
              <div className="w-6 h-6 rounded-full bg-primary text-primary-foreground text-xs flex items-center justify-center font-medium">1</div>
              <div>
                <p className="font-medium">Connect Your Wallet</p>
                <p className="text-sm text-muted-foreground">Connect your Ethereum wallet to get started</p>
              </div>
            </div>
            <div className="flex items-start space-x-3">
              <div className="w-6 h-6 rounded-full bg-primary text-primary-foreground text-xs flex items-center justify-center font-medium">2</div>
              <div>
                <p className="font-medium">Enter Amount</p>
                <p className="text-sm text-muted-foreground">Specify how many SynTK tokens you want to purchase</p>
              </div>
            </div>
            <div className="flex items-start space-x-3">
              <div className="w-6 h-6 rounded-full bg-primary text-primary-foreground text-xs flex items-center justify-center font-medium">3</div>
              <div>
                <p className="font-medium">Confirm Transaction</p>
                <p className="text-sm text-muted-foreground">Approve the transaction in your wallet to complete the purchase</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}