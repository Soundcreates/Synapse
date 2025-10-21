"use client";

import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ShoppingCart, Calculator } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useWallet } from "@/app/context/WalletContext";
import { useMkp } from "@/app/context/TokenMarketplaceContext";

export default function BuySynTKTokens() {
  const [amount, setAmount] = useState<string>("");
  const [calculating, setCalculating] = useState<boolean>(false);

  const { account } = useWallet();
  const context = useMkp();

  if (!context) {
    return <div>Loading marketplace context...</div>;
  }

  const { buyTokens, loading } = context;
  const { toast } = useToast();

  // Calculate cost: 1 SynTK = 0.0001 ETH
  const calculateCost = (tokenAmount: number): string => {
    return (tokenAmount * 0.0001).toFixed(6);
  };

  const handleBuyTokens = async () => {
    if (!account) {
      toast({
        title: "Wallet Not Connected",
        description: "Please connect your wallet first",
        variant: "destructive",
      });
      return;
    }

    const tokenAmount = parseFloat(amount);
    if (!tokenAmount || tokenAmount <= 0) {
      toast({
        title: "Invalid Amount",
        description: "Please enter a valid token amount",
        variant: "destructive",
      });
      return;
    }

    try {
      await buyTokens(tokenAmount, account);
      setAmount(""); // Clear input after successful purchase
    } catch (error: any) {
      console.error("Error buying tokens:", error);
      toast({
        title: "Purchase Failed",
        description: error.message || "Failed to buy tokens",
        variant: "destructive",
      });
    }
  };

  const tokenAmount = parseFloat(amount) || 0;
  const estimatedCost = calculateCost(tokenAmount);

  return (
    <Card className="w-full max-w-md mx-auto">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <ShoppingCart className="h-5 w-5" />
          Buy SynTK Tokens
        </CardTitle>
        <p className="text-sm text-muted-foreground">
          Purchase SynTK tokens from the marketplace
        </p>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Price Info */}
        <div className="bg-muted/50 p-4 rounded-lg">
          <div className="flex items-center gap-2 mb-2">
            <Calculator className="h-4 w-4" />
            <span className="text-sm font-medium">Token Price</span>
          </div>
          <div className="text-2xl font-bold">0.0001 ETH</div>
          <div className="text-sm text-muted-foreground">per 1 SynTK token</div>
        </div>

        {/* Amount Input */}
        <div className="space-y-2">
          <Label htmlFor="amount">Amount of SynTK tokens to buy</Label>
          <Input
            id="amount"
            type="number"
            placeholder="Enter token amount"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            min="0"
            step="0.01"
          />
        </div>

        {/* Cost Calculation */}
        {tokenAmount > 0 && (
          <div className="bg-blue-50 dark:bg-blue-950/20 p-4 rounded-lg border border-blue-200 dark:border-blue-800">
            <div className="text-sm text-blue-700 dark:text-blue-300 mb-1">
              Estimated Cost
            </div>
            <div className="text-xl font-bold text-blue-900 dark:text-blue-100">
              {estimatedCost} ETH
            </div>
            <div className="text-xs text-blue-600 dark:text-blue-400 mt-1">
              {tokenAmount} tokens × 0.0001 ETH = {estimatedCost} ETH
            </div>
          </div>
        )}

        {/* Buy Button */}
        <Button
          onClick={handleBuyTokens}
          disabled={loading || !account || !tokenAmount || tokenAmount <= 0}
          className="w-full"
        >
          {loading ? (
            "Processing..."
          ) : !account ? (
            "Connect Wallet First"
          ) : (
            `Buy ${tokenAmount || 0} SynTK Tokens`
          )}
        </Button>

        {/* Account Info */}
        {account && (
          <div className="text-xs text-muted-foreground text-center">
            Buying to: {account.slice(0, 6)}...{account.slice(-4)}
          </div>
        )}

        {/* Conversion Reference */}
        <div className="text-xs text-muted-foreground space-y-1 border-t pt-4">
          <div className="font-medium">Conversion Reference:</div>
          <div>• 1 SynTK = 0.0001 ETH (100,000,000,000,000 wei)</div>
          <div>• 10 SynTK = 0.001 ETH</div>
          <div>• 100 SynTK = 0.01 ETH</div>
          <div>• 1,000 SynTK = 0.1 ETH</div>
        </div>
      </CardContent>
    </Card>
  );
}