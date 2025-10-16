"use client"

import React, { createContext, useContext, useEffect, useState } from "react";
import { ethers } from "ethers";
import DataRegistry from "../../contractData/DataRegistry.json";

type DataPool = {
  id?: number;
  creator: string;
  ipfsHash: string;
  metadataHash: string;
  pricePerAccess: number;
  totalContributors: number;
  isActive: boolean;
}

type Contract = {
  address: string,
  abi: any,
  contractInstance: any,
}

type DataRegistryContextType = {
  createDataPool?: (ipfsHash: string, metaDataHash: string, pricePerAccess: number) => Promise<number>;
  assignContributors?: (dataPoolId: number, contributors: string[]) => Promise<void>;
  purchaseDataAccess?: (dataPoolId: number) => Promise<void>;
  _distributeRoyalties?: (dataPoolId: number, amount: number) => Promise<void>;
  getDataPool?: (dataPoolId: number) => Promise<DataPool>;
  getContributorShare?: (dataPoolId: number, contributor: string) => Promise<number>;
  getContributors?: (dataPoolId: number) => Promise<string[]>;
  contract: ethers.Contract | null;
  isLoading: boolean;
}


export const DataRegistryContext = createContext<DataRegistryContextType | undefined>(undefined);

export const DataRegistryContextProvider = ({ children }: { children: React.ReactNode }) => {
  const [contract, setContract] = useState<Contract>({ abi: DataRegistry.abi, address: DataRegistry.address, contractInstance: null });
  // const [dataPools, setDataPools] = useState<DataPool[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isClient, setIsClient] = useState<boolean>(false);

  useEffect(() => {
    setIsClient(true);
  }, [])

  const pro = (window as any).ethereum;

  useEffect(() => {
    const initializeContract = async () => {
      if (!isClient) return;
      const eth = (window as any).ethereum;
      if (!eth) {
        console.error("MetaMask not found");
        setIsLoading(false);
        return;
      }

      try {
        const provider = new ethers.BrowserProvider(eth);
        const signer = await provider.getSigner();

        //getting the contract instance
        const contractInstance = new ethers.Contract(
          contract.address,
          contract.abi,
          signer,
        );

        setContract(prev => ({ ...prev, contractInstance: contractInstance }));
        setIsLoading(false);
        console.log("Contract initialized:", contractInstance);
      } catch (err) {
        console.error("Error initializing contract:", err);
        setIsLoading(false);
      }
    };

    initializeContract();
  }, [isClient])

  const createDataPool = async (ipfsHash: string, metaDataHash: string, pricePerAccess: number) => {
    if (!contract.contractInstance) {
      console.error("Contract not initialized"); //will add react toastify later
      return null;
    }

    try {
      const tx = await contract.contractInstance.createDataPool(ipfsHash, metaDataHash, ethers.parseEther(pricePerAccess.toString()));
      const receipt = await tx.wait();

      //extracting dataPoolId from event logs
      const event = receipt.logs.find((log: any) => log.fragment?.name === "DataPoolCreated");
      return event ? Number(event.args[0]) : null;
    } catch (err) {
      console.error("Error creating data pool:", err);
      return null;
    }

  };

  return (
    <DataRegistryContext.Provider value={{}}>
      {children}
    </DataRegistryContext.Provider>
  )
};

export const useDataRegistry = () => {
  return useContext(DataRegistryContext);
}