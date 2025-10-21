"use client"
import React, { createContext, useContext, useEffect, useState } from "react";
import { useToast } from "@/hooks/use-toast";

type WalletContextType = {
  account: string;
  loadAccount: () => Promise<string | null>;
  disconnectWallet: () => void;
  isClient: boolean;
};

export const WalletContext = createContext<WalletContextType | undefined>(undefined);

export const WalletProvider = ({ children }: { children: React.ReactNode }) => {
  const [account, setAccount] = useState<string>("");
  const [isClient, setIsClient] = useState(false);
  const { toast } = useToast();

  // Prevent hydration mismatch by only setting state after client mount
  useEffect(() => {
    setIsClient(true);

    // Only access localStorage after client mount
    const stored = localStorage.getItem("user-account");
    if (stored) {
      setAccount(stored);
      // Also check if MetaMask is still connected to this account
      checkCurrentConnection();
    }
  }, []);

  const checkCurrentConnection = async () => {
    const ethereum = (window as any).ethereum;
    if (!ethereum) return;

    try {
      const accounts: string[] = await ethereum.request({ method: "eth_accounts" });
      if (accounts.length > 0) {
        const currentAccount = accounts[0];
        setAccount(currentAccount);
        localStorage.setItem("user-account", currentAccount);
      } else {
        // No longer connected, clear stored account
        setAccount("");
        localStorage.removeItem("user-account");
      }
    } catch (error) {
      console.error("Error checking connection: ", error);
    }
  };

  const loadAccount = async (): Promise<string | null> => {
    if (!isClient) return null;

    const ethereum = (window as any).ethereum;
    if (!ethereum) {
      console.error("MetaMask not found");
      toast({
        title: "MetaMask Required",
        description: "Please install MetaMask to connect your wallet.",
        variant: "destructive",
      });
      return null;
    }

    try {
      const accounts: string[] = await ethereum.request({ method: "eth_requestAccounts" });
      if (accounts.length === 0) {
        console.log("No accounts found");
        return null;
      }

      setAccount(accounts[0]);
      localStorage.setItem("user-account", accounts[0]);
      console.log("Account loaded: ", accounts[0]);
      return accounts[0];
    } catch (error) {
      console.error("Error loading account: ", error);
      return null;
    }
  };

  const disconnectWallet = () => {
    setAccount("");
    if (isClient) {
      localStorage.removeItem("user-account");
    }
  };

  useEffect(() => {
    if (!isClient) return;

    const ethereum = (window as any).ethereum;
    if (!ethereum) return;

    const handleAccountsChanged = (accounts: string[]) => {
      if (accounts.length === 0) {
        disconnectWallet();
      } else if (accounts[0] !== account) {
        setAccount(accounts[0]);
        localStorage.setItem("user-account", accounts[0]);
        console.log("Account changed to: ", accounts[0]);
      }
    };

    ethereum.on("accountsChanged", handleAccountsChanged);

    return () => {
      if (ethereum.removeListener) {
        ethereum.removeListener("accountsChanged", handleAccountsChanged);
      }
    };
  }, [account, isClient]);

  return (
    <WalletContext.Provider value={{ account, loadAccount, disconnectWallet, isClient }}>
      {children}
    </WalletContext.Provider>
  );
};

export const useWallet = () => {
  const context = useContext(WalletContext);
  if (!context) {
    throw new Error("useWallet must be used within a WalletProvider");
  }
  return context;
};