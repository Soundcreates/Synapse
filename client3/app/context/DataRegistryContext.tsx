"use client";

import React, { createContext, useContext, useEffect, useState } from "react";
import { ethers } from "ethers";
import { useToast } from "@/hooks/use-toast";
import DataRegistry from "../../contractData/DataRegistry.json";

type DataPool = {
  id?: number;
  creator: string;
  ipfsHash: string;
  metadataHash: string;
  pricePerAccess: bigint;
  totalContributors: number;
  isActive: boolean;
};

type Contract = {
  address: string;
  abi: any;
  contractInstance: ethers.Contract | null | undefined;
};

type CreateDataPoolType = {
  success: boolean;
  poolId: number | string | null;
  tx_hash: string;
};

type DataRegistryContextType = {
  // Main contract functions
  createDataPool: (
    ipfsHash: string,
    metaDataHash: string,
    pricePerAccess: string,
  ) => Promise<CreateDataPoolType | null>;
  assignContributors: (
    poolId: number,
    contributors: string[],
  ) => Promise<boolean>;
  purchaseDataAccessFromChain: (poolId: number | BigInt) => Promise<any>;

  // View functions
  getDataPool: (poolId: number) => Promise<DataPool | null>;
  getContributorShare: (
    poolId: number,
    contributor: string,
  ) => Promise<bigint | null>;
  getContributors: (poolId: number) => Promise<string[] | null>;
  getNextPoolId: () => Promise<number | null>;
  getCreatorPools: (creator: string, index: number) => Promise<number | null>;
  getRoyaltyDistributor: () => Promise<string | null>;
  getOwner: () => Promise<string | null>;
  getPaused: () => Promise<boolean | null>;

  // Contract state
  contract: ethers.Contract | null;
  isLoading: boolean;
  isClient: boolean;
};

export const DataRegistryContext = createContext<
  DataRegistryContextType | undefined
>(undefined);

export const DataRegistryContextProvider = ({
  children,
}: {
  children: React.ReactNode;
}) => {
  const [contract, setContract] = useState<Contract>({
    abi: JSON.parse(DataRegistry.abi),
    address: DataRegistry.address,
    contractInstance: null,
  });
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isClient, setIsClient] = useState<boolean>(false);
  const { toast } = useToast();

  useEffect(() => {
    setIsClient(true);
  }, []);

  useEffect(() => {
    const initializeContract = async () => {
      if (!isClient) return;

      const eth = (window as any).ethereum;
      if (!eth) {
        console.error("MetaMask not found");
        toast({
          title: "MetaMask Required",
          description: "Please install MetaMask to interact with the contract.",
          variant: "destructive",
        });
        setIsLoading(false);
        return;
      }

      try {
        const provider = new ethers.BrowserProvider(eth);
        const signer = await provider.getSigner();

        const contractInstance = new ethers.Contract(
          contract.address,
          JSON.parse(DataRegistry.abi),
          signer,
        );

        setContract((prev) => ({
          ...prev,
          contractInstance: contractInstance,
        }));
        setIsLoading(false);
        console.log("Contract initialized:", contractInstance);
      } catch (err) {
        console.error("Error initializing contract:", err);
        toast({
          title: "Contract Initialization Failed",
          description: "Failed to initialize the DataRegistry contract.",
          variant: "destructive",
        });
        setIsLoading(false);
      }
    };

    initializeContract();
  }, [isClient, toast]);

  // Create a new data pool
  const createDataPool = async (
    ipfsHash: string,
    metaDataHash: string,
    pricePerAccess: string,
  ): Promise<CreateDataPoolType | null> => {
    if (!isClient) {
      toast({
        title: "Client Not Ready",
        description: "Please wait for the application to load.",
        variant: "destructive",
      });
      return null;
    }

    if (!contract.contractInstance) {
      toast({
        title: "Contract Not Initialized",
        description: "Please make sure MetaMask is connected and try again.",
        variant: "destructive",
      });
      return null;
    }

    try {
      //first we convert price to wei
      const priceInWei = ethers.parseEther(pricePerAccess);
      const tx = await contract.contractInstance.createDataPool(
        ipfsHash,
        metaDataHash,
        priceInWei,
      );

      toast({
        title: "Transaction Submitted",
        description: "Creating data pool... Please wait for confirmation.",
      });

      console.log("Tx hash is: ", tx.hash);
      const tx_hash = tx.hash;
      const receipt = await tx.wait();

      // Extract poolId from event logs
      const event = receipt.logs.find((log: any) => {
        try {
          const parsed = contract.contractInstance!.interface.parseLog(log);
          return parsed?.name === "DataPoolCreated";
        } catch {
          return false;
        }
      });

      let poolId: number | null = null;
      if (event && contract.contractInstance) {
        try {
          const parsedLog = contract.contractInstance.interface.parseLog(event);
          poolId = parsedLog ? Number(parsedLog.args[0]) : null;
        } catch (err) {
          console.error("Error parsing event log:", err);
        }
      }

      toast({
        title: "Data Pool Created!",
        description: `Successfully created data pool with ID: ${poolId}`,
      });

      return {
        success: true,
        poolId: poolId,
        tx_hash: tx_hash,
      };
    } catch (err: any) {
      console.error("Error creating data pool:", err);
      toast({
        title: "Failed to Create Data Pool",
        description:
          err.reason ||
          err.message ||
          "An error occurred while creating the data pool.",
        variant: "destructive",
      });
      return null;
    }
  };

  // Assign contributors to a data pool
  const assignContributors = async (
    poolId: number,
    contributors: string[],
  ): Promise<boolean> => {
    if (!contract.contractInstance) {
      toast({
        title: "Contract Not Initialized",
        description: "Please wait for the contract to initialize.",
        variant: "destructive",
      });
      return false;
    }

    try {
      const tx = await contract.contractInstance.assignContributors(
        poolId,
        contributors,
      );

      toast({
        title: "Transaction Submitted",
        description: "Assigning contributors... Please wait for confirmation.",
      });

      await tx.wait();

      toast({
        title: "Contributors Assigned!",
        description: `Successfully assigned ${contributors.length} contributors to pool ${poolId}`,
      });

      return true;
    } catch (err: any) {
      console.error("Error assigning contributors:", err);
      toast({
        title: "Failed to Assign Contributors",
        description:
          err.reason ||
          err.message ||
          "An error occurred while assigning contributors.",
        variant: "destructive",
      });
      return false;
    }
  };

  // Purchase data access (note: amount is determined by the contract's pricePerAccess)
  const purchaseDataAccessFromChain = async (
    poolId: number | BigInt,
  ): Promise<any> => {
    if (!contract.contractInstance) {
      const error = new Error(
        "Contract not initialized. Please wait for the contract to initialize.",
      );
      toast({
        title: "Contract Not Initialized",
        description: "Please wait for the contract to initialize.",
        variant: "destructive",
      });
      throw error;
    }

    try {
      // First get the pool data to know the price
      const poolData = await contract.contractInstance.getDataPool(poolId);

      if (!poolData) {
        throw new Error("Failed to get pool data");
      }

      const pricePerAccess = poolData[3]; // pricePerAccess is the 4th element

      const tx = await contract.contractInstance.purchaseDataAccess(poolId, {
        value: pricePerAccess,
      });

      if (!tx) {
        throw new Error("Transaction failed to execute");
      }

      toast({
        title: "Transaction Submitted",
        description: "Purchasing data access... Please wait for confirmation.",
      });

      return tx;
    } catch (err: any) {
      console.error("Error purchasing data access:", err);
      throw err;
    }
  };

  // Get data pool information
  const getDataPool = async (poolId: number): Promise<DataPool | null> => {
    if (!contract.contractInstance) {
      return null;
    }

    try {
      const result = await contract.contractInstance.getDataPool(poolId);
      return {
        id: poolId,
        creator: result[0],
        ipfsHash: result[1],
        metadataHash: result[2],
        pricePerAccess: result[3],
        totalContributors: Number(result[4]),
        isActive: result[5],
      };
    } catch (err: any) {
      console.error("Error getting data pool:", err);
      return null;
    }
  };

  // Get contributor share
  const getContributorShare = async (
    poolId: number,
    contributor: string,
  ): Promise<bigint | null> => {
    if (!contract.contractInstance) return null;

    try {
      const share = await contract.contractInstance.getContributorShare(
        poolId,
        contributor,
      );
      return share;
    } catch (err: any) {
      console.error("Error getting contributor share:", err);
      return null;
    }
  };

  // Get contributors list
  const getContributors = async (poolId: number): Promise<string[] | null> => {
    if (!contract.contractInstance) return null;

    try {
      const contributors =
        await contract.contractInstance.getContributors(poolId);
      return contributors;
    } catch (err: any) {
      console.error("Error getting contributors:", err);
      return null;
    }
  };

  // Get next pool ID
  const getNextPoolId = async (): Promise<number | null> => {
    if (!contract.contractInstance) return null;

    try {
      const nextId = await contract.contractInstance.nextPoolId();
      return Number(nextId);
    } catch (err: any) {
      console.error("Error getting next pool ID:", err);
      return null;
    }
  };

  // Get creator pools
  const getCreatorPools = async (
    creator: string,
    index: number,
  ): Promise<number | null> => {
    if (!contract.contractInstance) return null;

    try {
      const poolId = await contract.contractInstance.creatorPools(
        creator,
        index,
      );
      return Number(poolId);
    } catch (err: any) {
      console.error("Error getting creator pools:", err);
      return null;
    }
  };

  // Get royalty distributor address
  const getRoyaltyDistributor = async (): Promise<string | null> => {
    if (!contract.contractInstance) return null;

    try {
      const distributor = await contract.contractInstance.royaltyDistributor();
      return distributor;
    } catch (err: any) {
      console.error("Error getting royalty distributor:", err);
      return null;
    }
  };

  // Get contract owner
  const getOwner = async (): Promise<string | null> => {
    if (!contract.contractInstance) return null;

    try {
      const owner = await contract.contractInstance.owner();
      return owner;
    } catch (err: any) {
      console.error("Error getting owner:", err);
      return null;
    }
  };

  // Get paused state
  const getPaused = async (): Promise<boolean | null> => {
    if (!contract.contractInstance) return null;

    try {
      const paused = await contract.contractInstance.paused();
      return paused;
    } catch (err: any) {
      console.error("Error getting paused state:", err);
      return null;
    }
  };

  const contextValue: DataRegistryContextType = {
    // Main functions
    createDataPool,
    assignContributors,
    purchaseDataAccessFromChain,

    // View functions
    getDataPool,
    getContributorShare,
    getContributors,
    getNextPoolId,
    getCreatorPools,
    getRoyaltyDistributor,
    getOwner,
    getPaused,

    // Contract state
    contract: contract.contractInstance || null,
    isLoading,
    isClient,
  };

  return (
    <DataRegistryContext.Provider value={contextValue}>
      {children}
    </DataRegistryContext.Provider>
  );
};

export const useDataRegistry = () => {
  const context = useContext(DataRegistryContext);
  if (context === undefined) {
    throw new Error(
      "useDataRegistry must be used within a DataRegistryContextProvider",
    );
  }
  return context;
};
