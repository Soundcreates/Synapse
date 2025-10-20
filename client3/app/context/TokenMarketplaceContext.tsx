"use client"

import React, { useState, useEffect, useContext, createContext } from "react";
import { ethers } from "ethers";
import { useToast } from "@/hooks/use-toast";
import TokenMarketPlace from "../../contractData/TokenMarketplace.json";
import SynTK from "../../contractData/SynTK.json";
import { toast } from "sonner";

type Contract = {
  address: string,
  abi: any,
  contractInstance: ethers.Contract | null,
}

type TokenMarketplaceContextType = {
  buyTokens: (amount: number, receiverAddr: string) => Promise<void>,
  fetchBalance: (receiverAddress: string) => Promise<string>,
  getContractTokenBalance: () => Promise<string>,
  loading: boolean,
  tokenContract: Contract,
  mkpContract: Contract,
  balance: string,
  tokenPrice: string,
}

export const TokenMarketPlaceContext = createContext<TokenMarketplaceContextType | undefined>(undefined);

export const TokenMarketPlaceProvider = ({ children }: { children: React.ReactNode }) => {
  const [balance, setBalance] = useState<string>("0");
  const [tokenPrice, setTokenPrice] = useState<string>("0.0001"); // 1e14 wei = 0.0001 ETH
  const [isClient, setIsClient] = useState<boolean>(false);
  //loading state as a helper (mostly aeshtetic and ux);
  const [loading, setLoading] = useState<boolean>(true);
  //the global state for the Syntk contract instance
  const [tokenContract, setTokenContract] = useState<Contract>({
    address: SynTK.address,
    abi: SynTK.abi,
    contractInstance: null,
  })

  //the global state for the TokenMarketplace contract instance
  const [mkpContract, setMkpContract] = useState<Contract>({
    address: TokenMarketPlace.address,
    abi: TokenMarketPlace.abi,
    contractInstance: null,
  })
  //first i will get the SYnTK functions


  const { toast } = useToast();

  useEffect(() => {
    setIsClient(true);
  }, []);

  const eth = (window as any).ethereum;
  //grabbing contact
  useEffect(() => {
    const initSynTKContract = async () => {
      if (!isClient) return;


      if (!eth) {
        console.error("Metamask not found");
        toast({
          title: "Metamask Required",
          description: "Please install metamask to interact with the website",
          variant: "destructive",
        })
        setLoading(false);
        return;
      }

      try {
        const provider = new ethers.BrowserProvider(eth);
        const signer = await provider.getSigner();

        const synTKInstance = new ethers.Contract(
          SynTK.address,
          SynTK.abi,
          signer,
        )

        setTokenContract(prev => ({ ...prev, contractInstance: synTKInstance }))
        setLoading(false);
        console.log("Contract initalized: ", synTKInstance);

      } catch (err) {
        console.error("error initalizing contract: ", err);
        toast({
          title: "Contract Initialization Failed",
          description: "Failed to initialize the DataRegistry contract.",
          variant: "default",
        });
        setLoading(false);
      }
    }

    const initMarketplaceContract = async () => {
      if (!isClient) return;

      if (!eth) {
        console.error("Metamask not found");
        toast({
          title: "Metamask Required",
          description: "Please install metamask to interact with the website",
          variant: "default",
        });
        setLoading(false);
        return;
      }

      try {
        const provider = new ethers.BrowserProvider(eth);
        const signer = await provider.getSigner();

        const mkpInstance = new ethers.Contract(
          TokenMarketPlace.address,
          TokenMarketPlace.abi,
          signer,
        )

        setMkpContract(prev => ({ ...prev, contractInstance: mkpInstance }))
        setLoading(false);
        console.log("Contract initalized: ", mkpInstance);

      } catch (err) {
        console.error("error initalizing contract: ", err);
        setLoading(false);
      }
    }

    initSynTKContract();
    initMarketplaceContract();
  }, [isClient]);

  // Fetch token price from contract
  useEffect(() => {
    const fetchTokenPrice = async () => {
      if (mkpContract.contractInstance) {
        try {
          const price = await mkpContract.contractInstance.TOKEN_PRICE();
          setTokenPrice(ethers.formatEther(price));
        } catch (err) {
          console.error("Error fetching token price:", err);
        }
      }
    };

    fetchTokenPrice();
  }, [mkpContract.contractInstance]);


  //implementing the context functions

  const buyTokens = async (amount: number, receiverAddr: string) => {
    //function to buy tokens from the marketplace
    if (!mkpContract.contractInstance) {
      throw new Error("Marketplace contract not initialized");
    }

    try {
      setLoading(true);
      const mkp = mkpContract.contractInstance;


      const tokenAmount = ethers.parseUnits(amount.toString(), 18); // Assuming 18 decimals
      const cost = ethers.parseEther((amount * parseFloat(tokenPrice)).toString());


      const tx = await mkp.buyTokens(tokenAmount, receiverAddr, {
        value: cost
      });

      await tx.wait();

      toast({
        title: "Tokens Purchased",
        description: `Successfully purchased ${amount} tokens for ${ethers.formatEther(cost)} ETH.`,
      });

      // this to update the balance right after the user purchases, without having to reload 
      await fetchBalance(receiverAddr);

    } catch (err: any) {
      console.error("Error buying tokens:", err);
      toast({
        title: "Purchase Failed",
        description: err.message || "Failed to purchase tokens",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  }

  const fetchBalance = async (receiverAddress: string): Promise<string> => {
    if (!tokenContract.contractInstance) {
      throw new Error("Token contract not initialized");
    }

    try {
      const token = tokenContract.contractInstance;
      // balanceOf is a view function, no need to wait for transaction
      const balanceWei = await token.balanceOf(receiverAddress);
      const balanceEther = ethers.formatEther(balanceWei);

      setBalance(balanceEther);
      return balanceEther;

    } catch (err: any) {
      console.error("Error fetching balance:", err);
      toast({
        title: "Error",
        description: "Failed to fetch token balance",
        variant: "destructive",
      });
      return "0";
    }
  }

  // Get contract token balance (available tokens for sale)
  const getContractTokenBalance = async (): Promise<string> => {
    if (!tokenContract.contractInstance || !mkpContract.contractInstance) {
      return "0";
    }

    try {
      const balance = await tokenContract.contractInstance.balanceOf(mkpContract.address);
      return ethers.formatEther(balance);
    } catch (err) {
      console.error("Error fetching contract balance:", err);
      return "0";
    }
  }


  return (
    <TokenMarketPlaceContext.Provider value={{
      buyTokens,
      fetchBalance,
      getContractTokenBalance,
      balance,
      loading,
      mkpContract,
      tokenContract,
      tokenPrice
    }}>
      {children}
    </TokenMarketPlaceContext.Provider>
  )
}



export const useMkp = () => {
  return useContext(TokenMarketPlaceContext);
}