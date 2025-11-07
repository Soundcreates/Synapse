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

  // Contributor functions
  contributorStake: (
    stakeAmount: string,
    poolId: number,
  ) => Promise<boolean>;
  acceptStake: (
    poolId: number,
    contributor: string,
  ) => Promise<boolean>;
  rejectStake: (
    poolId: number,
    contributor: string,
  ) => Promise<boolean>;
  withdrawStake: (
    poolId: number,
  ) => Promise<boolean>;
  getPendingStake: (
    poolId: number,
    contributor: string,
  ) => Promise<bigint | null>;
  getContributorStake: (
    poolId: number,
    contributor: string,
  ) => Promise<bigint | null>;

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

  // Pool management functions
  getUserOwnedPools: (userAddress: string) => Promise<number[] | null>;
  getAllPendingStakesForUserPools: (userAddress: string) => Promise<{
    poolId: number;
    contributor: string;
    stakeAmount: string;
    poolName: string;
  }[] | null>;

  // Royalty functions
  claimRoyalties: () => Promise<boolean>;
  getPendingRoyalties: (address: string) => Promise<bigint | null>;

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
      // Convert SYN tokens directly to wei (1 SYN token = 1e18 wei)
      const priceInWei = ethers.parseUnits(pricePerAccess, 18);
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
      // First get the pool data to know the price and creator
      const poolData = await contract.contractInstance.getDataPool(poolId);

      if (!poolData) {
        throw new Error("Failed to get pool data");
      }

      const creatorAddress = poolData[0];
      const pricePerAccess = poolData[3]; // pricePerAccess in wei
      console.log("Price per access (wei):", pricePerAccess.toString());

      // Get signer and caller address
      const eth = (window as any).ethereum;
      const provider = new ethers.BrowserProvider(eth);
      const signer = await provider.getSigner();
      const userAddress = await signer.getAddress();

      console.log("Purchase attempt - caller:", userAddress, "creator:", creatorAddress);
      if (userAddress.toLowerCase() === String(creatorAddress).toLowerCase()) {
        throw new Error(`Creator cannot purchase their own data. Caller: ${userAddress}, Creator: ${creatorAddress}`);
      }

      // Price is already in SYNTK token wei (1 SYNTK = 1e18 wei)
      // No conversion needed - use the price directly
      const tokensNeeded = BigInt(pricePerAccess.toString());

      console.log("Tokens needed:", ethers.formatUnits(tokensNeeded, 18), "SYNTK");

      // Import SynTK contract data and get token contract with signer
      const SynTK = await import("../../contractData/SynTK.json");
      const tokenContract = new ethers.Contract(
        SynTK.address,
        JSON.parse(SynTK.abi),
        signer,
      );

      // Check user's token balance
      const userBalanceBN = await tokenContract.balanceOf(userAddress);
      const userBalance = BigInt(userBalanceBN.toString());
      console.log("User balance:", userBalance.toString());

      if (userBalance < tokensNeeded) {
        const userBalanceFormatted = ethers.formatUnits(userBalanceBN, 18);
        const requiredFormatted = ethers.formatUnits(tokensNeeded, 18);
        throw new Error(`Insufficient SYNTK token balance. You have ${userBalanceFormatted} SYNTK but need ${requiredFormatted} SYNTK. Please visit the Buy page to purchase more tokens.`);
      }

      // Check current allowance and approve if necessary
      const currentAllowanceBN = await tokenContract.allowance(userAddress, contract.address);
      const currentAllowance = BigInt(currentAllowanceBN.toString());
      console.log("Current allowance:", currentAllowance.toString());

      if (currentAllowance < tokensNeeded) {
        toast({
          title: "Token Approval Required",
          description: "Approving tokens for purchase...",
        });

        const approveTx = await tokenContract.approve(contract.address, tokensNeeded);
        console.log("Approve transaction:", approveTx.hash);
        await approveTx.wait();

        toast({
          title: "Tokens Approved",
          description: "Proceeding with purchase...",
        });
      }

      // Now make the purchase using the signer-connected contract
      const signedContract = contract.contractInstance.connect(signer);
      const tx = await (signedContract as any).purchaseDataAccess(poolId);

      if (!tx) {
        throw new Error("Transaction failed to execute");
      }

      toast({
        title: "Transaction Submitted",
        description: "Purchasing data access... Please wait for confirmation.",
      });

      console.log("Purchase transaction:", tx.hash);
      return tx;
    } catch (err: any) {
      console.error("Error purchasing data access:", err);

      // Enhanced error handling
      if (err.message && err.message.includes("insufficient funds")) {
        throw new Error("Insufficient funds in wallet. Please add more ETH for gas fees.");
      } else if (err.message && err.message.includes("Insufficient SYNTK token balance")) {
        throw err; // Re-throw our custom error
      } else if (err.code === "ACTION_REJECTED") {
        throw new Error("Transaction was rejected by user.");
      } else if (err.message && err.message.includes("Creator cannot purchase")) {
        throw new Error("Dataset creators cannot purchase their own datasets.");
      } else if (err.message && err.message.includes("Pool is not active")) {
        throw new Error("This dataset pool is not active.");
      } else if (err.message && err.message.includes("execution reverted")) {
        // Try to extract more specific error information
        if (err.data && typeof err.data === "string" && err.data.startsWith("0xe450d38c")) {
          throw new Error("Token transfer failed. Please ensure you have enough SYNTK tokens and try again.");
        }
        throw new Error("Transaction failed. Please check your token balance and allowances.");
      }

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

  // Contributor stake function
  const contributorStake = async (
    stakeAmount: string,
    poolId: number,
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
      // Convert stake amount to wei (18 decimals)
      const stakeAmountInWei = ethers.parseUnits(stakeAmount, 18);

      // Get SynTK contract for approval
      const SynTK = await import("../../contractData/SynTK.json");
      const eth = (window as any).ethereum;
      const provider = new ethers.BrowserProvider(eth);
      const signer = await provider.getSigner();
      const userAddress = await signer.getAddress();

      const tokenContract = new ethers.Contract(
        SynTK.address,
        JSON.parse(SynTK.abi),
        signer,
      );

      // First, let's check if the pool exists and is active
      const poolData = await contract.contractInstance.getDataPool(poolId);
      if (!poolData || !poolData[5]) { // isActive is index 5
        toast({
          title: "Invalid Pool",
          description: "This dataset pool does not exist or is not active.",
          variant: "destructive",
        });
        return false;
      }

      // Check if user already has a pending stake
      const existingPendingStake = await contract.contractInstance.getPendingStake(poolId, userAddress);
      if (existingPendingStake && existingPendingStake > 0n) {
        toast({
          title: "Stake Already Pending",
          description: "You already have a pending stake for this dataset. Please wait for creator approval.",
          variant: "destructive",
        });
        return false;
      }

      // Check balance
      const userBalanceBN = await tokenContract.balanceOf(userAddress);
      const userBalance = BigInt(userBalanceBN.toString());
      const stakeAmountBN = BigInt(stakeAmountInWei.toString());

      console.log("User balance:", userBalance.toString());
      console.log("Stake amount:", stakeAmountBN.toString());

      if (userBalance < stakeAmountBN) {
        toast({
          title: "Insufficient Balance",
          description: `You need ${ethers.formatUnits(stakeAmountInWei, 18)} SYNTK tokens but only have ${ethers.formatUnits(userBalance, 18)} SYNTK.`,
          variant: "destructive",
        });
        return false;
      }

      // Check current allowance
      const currentAllowanceBN = await tokenContract.allowance(userAddress, contract.address);
      const currentAllowance = BigInt(currentAllowanceBN.toString());

      console.log("Current allowance:", currentAllowance.toString());
      console.log("Required allowance:", stakeAmountBN.toString());

      // Approve if needed (always approve exact amount for security)
      if (currentAllowance < stakeAmountBN) {
        toast({
          title: "Approving Tokens",
          description: "Approving tokens for staking...",
        });

        const approveTx = await tokenContract.approve(contract.address, stakeAmountInWei);
        console.log("Approve transaction:", approveTx.hash);
        await approveTx.wait();

        toast({
          title: "Tokens Approved",
          description: "Proceeding with stake...",
        });

        // Verify approval succeeded
        const newAllowance = await tokenContract.allowance(userAddress, contract.address);
        console.log("New allowance after approval:", newAllowance.toString());
      }

      // Now call contributorStake with signer-connected contract
      const signedContract = contract.contractInstance.connect(signer);
      const tx = await signedContract.contributorStake(stakeAmountInWei, poolId);

      toast({
        title: "Transaction Submitted",
        description: "Staking tokens... Please wait for confirmation.",
      });

      console.log("Stake transaction:", tx.hash);
      await tx.wait();

      toast({
        title: "Stake Submitted!",
        description: `Successfully staked ${stakeAmount} SYNTK tokens. Awaiting creator approval.`,
      });

      return true;
    } catch (err: any) {
      console.error("Error staking tokens:", err);

      // Enhanced error handling for staking
      let errorMessage = "An error occurred while staking tokens.";

      if (err.message && err.message.includes("execution reverted")) {
        if (err.data && typeof err.data === "string") {
          // Try to decode the custom error
          if (err.data.includes("fb8f41b2")) {
            errorMessage = "Token transfer failed. Please check your token balance and allowances.";
          } else {
            errorMessage = "Smart contract execution failed. Please check your stake amount and try again.";
          }
        } else {
          errorMessage = "Transaction was rejected by the smart contract.";
        }
      } else if (err.message && err.message.includes("insufficient funds")) {
        errorMessage = "Insufficient ETH for gas fees. Please add more ETH to your wallet.";
      } else if (err.code === "ACTION_REJECTED") {
        errorMessage = "Transaction was rejected by user.";
      } else if (err.message && err.message.includes("Pool does not exist")) {
        errorMessage = "This dataset pool does not exist.";
      } else if (err.message && err.message.includes("Pool is not active")) {
        errorMessage = "This dataset pool is not currently active.";
      } else if (err.message && err.message.includes("Stake already pending")) {
        errorMessage = "You already have a pending stake for this dataset.";
      }

      toast({
        title: "Failed to Stake",
        description: errorMessage,
        variant: "destructive",
      });
      return false;
    }
  };

  // Accept stake function (for pool creators)
  const acceptStake = async (
    poolId: number,
    contributor: string,
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
      const tx = await contract.contractInstance.acceptStake(poolId, contributor);

      toast({
        title: "Transaction Submitted",
        description: "Accepting stake... Please wait for confirmation.",
      });

      await tx.wait();

      toast({
        title: "Stake Accepted!",
        description: `Successfully accepted stake from ${contributor.slice(0, 6)}...${contributor.slice(-4)}`,
      });

      return true;
    } catch (err: any) {
      console.error("Error accepting stake:", err);
      toast({
        title: "Failed to Accept Stake",
        description:
          err.reason || err.message || "An error occurred while accepting the stake.",
        variant: "destructive",
      });
      return false;
    }
  };

  // Reject stake function (for pool creators)
  const rejectStake = async (
    poolId: number,
    contributor: string,
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
      const tx = await contract.contractInstance.rejectStake(poolId, contributor);

      toast({
        title: "Transaction Submitted",
        description: "Rejecting stake... Please wait for confirmation.",
      });

      await tx.wait();

      toast({
        title: "Stake Rejected!",
        description: `Successfully rejected stake from ${contributor.slice(0, 6)}...${contributor.slice(-4)}. Tokens returned.`,
      });

      return true;
    } catch (err: any) {
      console.error("Error rejecting stake:", err);
      toast({
        title: "Failed to Reject Stake",
        description:
          err.reason || err.message || "An error occurred while rejecting the stake.",
        variant: "destructive",
      });
      return false;
    }
  };

  // Withdraw stake function (for contributors)
  const withdrawStake = async (
    poolId: number,
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
      const tx = await contract.contractInstance.withdrawStake(poolId);

      toast({
        title: "Transaction Submitted",
        description: "Withdrawing stake... Please wait for confirmation.",
      });

      await tx.wait();

      toast({
        title: "Stake Withdrawn!",
        description: "Successfully withdrew your stake. Tokens have been returned to your wallet.",
      });

      return true;
    } catch (err: any) {
      console.error("Error withdrawing stake:", err);
      toast({
        title: "Failed to Withdraw Stake",
        description:
          err.reason || err.message || "An error occurred while withdrawing the stake.",
        variant: "destructive",
      });
      return false;
    }
  };

  // Get pending stake
  const getPendingStake = async (
    poolId: number,
    contributor: string,
  ): Promise<bigint | null> => {
    if (!contract.contractInstance) return null;

    try {
      const stake = await contract.contractInstance.getPendingStake(
        poolId,
        contributor,
      );
      return stake;
    } catch (err: any) {
      console.error("Error getting pending stake:", err);
      return null;
    }
  };

  // Get contributor stake
  const getContributorStake = async (
    poolId: number,
    contributor: string,
  ): Promise<bigint | null> => {
    if (!contract.contractInstance) return null;

    try {
      const stake = await contract.contractInstance.getContributorStake(
        poolId,
        contributor,
      );
      return stake;
    } catch (err: any) {
      console.error("Error getting contributor stake:", err);
      return null;
    }
  };

  // Get all pools owned by a user
  const getUserOwnedPools = async (userAddress: string): Promise<number[] | null> => {
    if (!contract.contractInstance) return null;

    try {
      const ownedPools: number[] = [];
      let index = 0;

      // Keep fetching pools until we get an error (no more pools)
      while (true) {
        try {
          const poolId = await contract.contractInstance.creatorPools(userAddress, index);
          if (poolId && Number(poolId) > 0) {
            ownedPools.push(Number(poolId));
            index++;
          } else {
            break;
          }
        } catch {
          break; // No more pools
        }
      }

      return ownedPools;
    } catch (err: any) {
      console.error("Error getting user owned pools:", err);
      return null;
    }
  };

  // Get all pending stakes for user's pools
  const getAllPendingStakesForUserPools = async (userAddress: string) => {
    if (!contract.contractInstance) return null;

    try {
      const userPools = await getUserOwnedPools(userAddress);
      if (!userPools || userPools.length === 0) return [];

      const pendingStakes: {
        poolId: number;
        contributor: string;
        stakeAmount: string;
        poolName: string;
      }[] = [];

      // For each pool owned by the user
      for (const poolId of userPools) {
        try {
          // Get pool data for the name
          const poolData = await getDataPool(poolId);
          const poolName = poolData ? `Pool ${poolId}` : `Unknown Pool`;

          // We need to check potential contributors
          // Since we can't easily iterate through all possible addresses,
          // this would need to be tracked differently in a real application
          // For now, we'll return an empty array and handle this in the UI
          // by showing a message to check the admin panel
        } catch (err) {
          console.error(`Error processing pool ${poolId}:`, err);
        }
      }

      return pendingStakes;
    } catch (err: any) {
      console.error("Error getting pending stakes:", err);
      return null;
    }
  };

  // Claim royalties from RoyaltyDistribution contract
  const claimRoyalties = async (): Promise<boolean> => {
    if (!contract.contractInstance) {
      toast({
        title: "Contract Not Initialized",
        description: "Please wait for the contract to initialize.",
        variant: "destructive",
      });
      return false;
    }

    try {
      const RoyaltyDistribution = await import("../../contractData/RoyaltyDistribution.json");
      const eth = (window as any).ethereum;
      const provider = new ethers.BrowserProvider(eth);
      const signer = await provider.getSigner();

      const royaltyContract = new ethers.Contract(
        RoyaltyDistribution.address,
        JSON.parse(RoyaltyDistribution.abi),
        signer,
      );

      const tx = await royaltyContract.claimRoyalties();

      toast({
        title: "Transaction Submitted",
        description: "Claiming royalties... Please wait for confirmation.",
      });

      await tx.wait();

      toast({
        title: "Royalties Claimed!",
        description: "Successfully claimed your pending royalties.",
      });

      return true;
    } catch (err: any) {
      console.error("Error claiming royalties:", err);
      toast({
        title: "Failed to Claim Royalties",
        description:
          err.reason || err.message || "An error occurred while claiming royalties.",
        variant: "destructive",
      });
      return false;
    }
  };

  // Get pending royalties for an address
  const getPendingRoyalties = async (address: string): Promise<bigint | null> => {
    if (!contract.contractInstance) return null;

    try {
      const RoyaltyDistribution = await import("../../contractData/RoyaltyDistribution.json");
      const eth = (window as any).ethereum;
      const provider = new ethers.BrowserProvider(eth);

      const royaltyContract = new ethers.Contract(
        RoyaltyDistribution.address,
        JSON.parse(RoyaltyDistribution.abi),
        provider,
      );

      const pendingAmount = await royaltyContract.pendingRoyalties(address);
      return pendingAmount;
    } catch (err: any) {
      console.error("Error getting pending royalties:", err);
      return null;
    }
  };

  const contextValue: DataRegistryContextType = {
    // Main functions
    createDataPool,
    assignContributors,
    purchaseDataAccessFromChain,

    // Contributor functions
    contributorStake,
    acceptStake,
    rejectStake,
    withdrawStake,
    getPendingStake,
    getContributorStake,

    // View functions
    getDataPool,
    getContributorShare,
    getContributors,
    getNextPoolId,
    getCreatorPools,
    getRoyaltyDistributor,
    getOwner,
    getPaused,

    // Pool management functions
    getUserOwnedPools,
    getAllPendingStakesForUserPools,

    // Royalty functions
    claimRoyalties,
    getPendingRoyalties,

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
