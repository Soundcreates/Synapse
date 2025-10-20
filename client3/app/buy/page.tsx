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

// Extend Window interface for ethereum
declare global {
  interface Window {
    ethereum?: any
  }
}

export default function BuyTokensPage() {
  const [amount, setAmount] = useState("")
  const [loading, setLoading] = useState(false)
  const [tokenBalance, setTokenBalance] = useState("0")
  const { account: walletAddress } = useWallet();
  const { toast } = useToast()

  // Contract addresses (you'll need to update these with your deployed addresses)
  const TOKEN_MARKETPLACE_ADDRESS = TokenMarketplaceABI.address
  const SYNTK_ADDRESS = SynTKABI.address

  useEffect(() => {
    if (walletAddress) {
      fetchTokenBalance()
    }
  }, [walletAddress])

  const fetchTokenBalance = async () => {
    try {
      if (!window.ethereum || !walletAddress) return

      const provider = new ethers.BrowserProvider(window.ethereum)
      const tokenContract = new ethers.Contract(SYNTK_ADDRESS, JSON.parse(SynTKABI.abi), provider)

      const balance = await tokenContract.balanceOf(walletAddress)
      setTokenBalance(ethers.formatEther(balance))
    } catch (error) {
      console.error("Error fetching token balance:", error)
      toast({
        title: "Error",
        description: "Failed to fetch token balance",
        variant: "destructive"
      })
    }
  }

  const handleBuyTokens = async () => {
    if (!walletAddress) {
      toast({
        title: "Wallet Not Connected",
        description: "Please connect your wallet to buy tokens.",
        variant: "destructive"
      })
      return
    }

    if (!amount || parseFloat(amount) <= 0) {
      toast({
        title: "Invalid Amount",
        description: "Please enter a valid amount of tokens to buy.",
        variant: "destructive"
      })
      return
    }

    setLoading(true)

    try {
      if (!window.ethereum) {
        throw new Error("No ethereum provider found")
      }

      const provider = new ethers.BrowserProvider(window.ethereum)
      const signer = await provider.getSigner()

      const marketplaceContract = new ethers.Contract(
        TOKEN_MARKETPLACE_ADDRESS,
        JSON.parse(TokenMarketplaceABI.abi),
        signer
      )

      // Convert amount to wei (assuming 18 decimals)
      const amountInWei = ethers.parseEther(amount)

      // Call the BuyTokens function from your contract
      const tx = await marketplaceContract.BuyTokens(amountInWei, walletAddress)

      toast({
        title: "Transaction Submitted",
        description: "Your token purchase transaction has been submitted. Please wait for confirmation.",
      })

      // Wait for transaction confirmation
      await tx.wait()

      toast({
        title: "Purchase Successful!",
        description: `Successfully purchased ${amount} SynTK tokens!`,
      })

      // Refresh token balance
      await fetchTokenBalance()
      setAmount("")

    } catch (error: any) {
      console.error("Error buying tokens:", error)
      toast({
        title: "Purchase Failed",
        description: error.message || "Failed to purchase tokens. Please try again.",
        variant: "destructive"
      })
    } finally {
      setLoading(false)
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
              {tokenBalance} SynTK
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
                onChange={(e) => setAmount(e.target.value)}
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
                <span className="font-medium">{amount ? `${parseFloat(amount) * 0.001} ETH` : "0 ETH"}</span>
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