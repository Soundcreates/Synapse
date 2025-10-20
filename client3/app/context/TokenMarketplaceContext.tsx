"use client"

import React, { useState, useEffect, useContext, createContext, Children } from "react";
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
  BuyToken: (amount: number, receiverAddr: string) => Promise<void>,
  BalanceOf: (receiverAddress: string) => Promise<BigInt | number>,
  loading: boolean,
  tokenContract: ethers.Contract | null,
  mkpContract: ethers.Contract | null,

}

export const TokenMarketPlaceContext = createContext<TokenMarketplaceContextType | undefined>(undefined);

export const TokenMarketPlaceProvider = ({ children }: { children: React.ReactNode }) => {
  const [balance, setBalance] = useState<BigInt | number>(0);
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
  }, []);


  //implementing the context functions

  const BuyToken: TokenMarketplaceContextType["BuyToken"] = async (amount, receiverAddr) => {
    //function to buy tokens from the marketplace
    if (!mkpContract.contractInstance) {
      throw new Error("Marketplace contract not initialized");
    }
    let mkp = mkpContract.contractInstance;
    try {
      const tx = await mkp.BuyTokens(ethers.parseEther(amount.toString()), receiverAddr);
      await tx.wait();
      toast({
        title: "Tokens Purchased",
        description: `Successfully purchased ${amount} tokens.`,
      })
    } catch (err) {
      console.error("Error at Buy token  function at mkpcontext file");
    }

  }


  return (
    <TokenMarketPlaceContext.Provider value={{}}>
      {children}
    </TokenMarketPlaceContext.Provider>
  )
}



export const useMkp = () => {
  return useContext(TokenMarketPlaceContext);
}