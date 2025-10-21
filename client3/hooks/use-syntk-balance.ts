import { useState, useEffect } from "react";
import { ethers } from "ethers";
import { useWallet } from "@/app/context/WalletContext";
import SynTK from "@/contractData/SynTK.json";

export function useSynTKBalance() {
  const [balance, setBalance] = useState<string>("0");
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const { account } = useWallet();

  const fetchBalance = async () => {
    if (!account || !ethers.isAddress(account)) {
      setBalance("0");
      return;
    }

    try {
      setLoading(true);
      setError(null);

      const eth = (window as any).ethereum;
      if (!eth) {
        throw new Error("MetaMask not found");
      }

      // Check if on Sepolia network
      const chainId = await eth.request({ method: "eth_chainId" });
      if (chainId !== "0xaa36a7") {
        throw new Error("Please switch to Sepolia testnet");
      }

      const provider = new ethers.BrowserProvider(eth);
      const signer = await provider.getSigner();

      const tokenContract = new ethers.Contract(
        SynTK.address,
        JSON.parse(SynTK.abi),
        signer
      );

      const balanceWei = await tokenContract.balanceOf(account);
      const balanceFormatted = ethers.formatEther(balanceWei);

      setBalance(balanceFormatted);
      console.log(`SynTK Balance: ${balanceFormatted}`);
    } catch (err: any) {
      console.error("Error fetching SynTK balance:", err);
      setError(err.message);
      setBalance("0");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (account) {
      fetchBalance();
    }
  }, [account]);

  return {
    balance,
    loading,
    error,
    refetch: fetchBalance,
  };
}
