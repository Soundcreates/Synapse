"use client"

import React, { useState, useEffect, useContext, createContext } from "react";
import { ethers } from "ethers";
import { useToast } from "@/hooks/use-toast";
import TokenMarketPlace from "../../contractData/TokenMarketplace.json";
import SynTK from "../../contractData/SynTK.json";
import { toast } from "sonner";
import { useWallet } from "./WalletContext";

type Contract = {
  address: string,
  abi: any,
  contractInstance: ethers.Contract | null,
}

type TokenMarketplaceContextType = {
  buyTokens: (amount: number, receiverAddr: string) => Promise<void>,
  fetchBalance: (receiverAddress: string) => Promise<string>,
  getContractTokenBalance: () => Promise<string>,
  switchToSepolia: () => Promise<void>,
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
    abi: typeof SynTK.abi === 'string' ? JSON.parse(SynTK.abi) : SynTK.abi,
    contractInstance: null,
  })

  const { account } = useWallet();

  //the global state for the TokenMarketplace contract instance
  const [mkpContract, setMkpContract] = useState<Contract>({
    address: TokenMarketPlace.address,
    abi: typeof TokenMarketPlace.abi === 'string' ? JSON.parse(TokenMarketPlace.abi) : TokenMarketPlace.abi,
    contractInstance: null,
  })
  //first i will get the SYnTK functions


  const { toast } = useToast();

  useEffect(() => {
    setIsClient(true);
  }, []);

  // Function to switch to Sepolia network
  const switchToSepolia = async () => {
    const eth = (window as any).ethereum;
    if (!eth) return;

    try {
      // Try to switch to Sepolia
      await eth.request({
        method: 'wallet_switchEthereumChain',
        params: [{ chainId: '0xaa36a7' }], // Sepolia Chain ID in hex
      });
    } catch (switchError: any) {
      // If Sepolia is not added, add it
      if (switchError.code === 4902) {
        try {
          await eth.request({
            method: 'wallet_addEthereumChain',
            params: [{
              chainId: '0xaa36a7',
              chainName: 'Sepolia Test Network',
              nativeCurrency: {
                name: 'ETH',
                symbol: 'ETH',
                decimals: 18,
              },
              rpcUrls: ['https://sepolia.infura.io/v3/'],
              blockExplorerUrls: ['https://sepolia.etherscan.io/'],
            }],
          });
        } catch (addError) {
          console.error('Failed to add Sepolia network:', addError);
        }
      } else {
        console.error('Failed to switch to Sepolia:', switchError);
      }
    }
  };

  //grabbing contact
  useEffect(() => {
    const eth = (window as any).ethereum;

    const initContracts = async () => {
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

        // Check if user is connected
        const accounts = await provider.listAccounts();
        if (accounts.length === 0) {
          console.log("No accounts connected, contracts will be read-only");
          // Initialize with provider only for read-only operations
          await initContractsWithProvider(provider);
        } else {
          // Initialize with signer for full functionality
          const signer = await provider.getSigner();
          await initContractsWithSigner(signer);
        }

        setLoading(false);
        console.log("Contracts initialized successfully");

      } catch (err) {
        console.error("Error initializing contracts:", err);
        toast({
          title: "Contract Initialization Failed",
          description: "Failed to initialize contracts. Please check your wallet connection.",
          variant: "destructive",
        });
        setLoading(false);
      }
    }

    const initContractsWithProvider = async (provider: ethers.BrowserProvider) => {
      try {
        // Initialize SynTK contract
        const parsedAbi = typeof SynTK.abi === 'string' ? JSON.parse(SynTK.abi) : SynTK.abi;
        const synTKInstance = new ethers.Contract(SynTK.address, parsedAbi, provider);
        setTokenContract(prev => ({ ...prev, contractInstance: synTKInstance }));

        // Initialize Marketplace contract
        const parsedMkpAbi = typeof TokenMarketPlace.abi === 'string' ? JSON.parse(TokenMarketPlace.abi) : TokenMarketPlace.abi;
        const mkpInstance = new ethers.Contract(TokenMarketPlace.address, parsedMkpAbi, provider);
        setMkpContract(prev => ({ ...prev, contractInstance: mkpInstance }));

        console.log("Contracts initialized with provider (read-only mode)");
      } catch (err) {
        console.error("Error initializing contracts with provider:", err);
        throw err;
      }
    }

    const initContractsWithSigner = async (signer: ethers.JsonRpcSigner) => {
      try {
        // Initialize SynTK contract
        const parsedAbi = typeof SynTK.abi === 'string' ? JSON.parse(SynTK.abi) : SynTK.abi;
        const synTKInstance = new ethers.Contract(SynTK.address, parsedAbi, signer);
        setTokenContract(prev => ({ ...prev, contractInstance: synTKInstance }));

        // Initialize Marketplace contract  
        const parsedMkpAbi = typeof TokenMarketPlace.abi === 'string' ? JSON.parse(TokenMarketPlace.abi) : TokenMarketPlace.abi;
        const mkpInstance = new ethers.Contract(TokenMarketPlace.address, parsedMkpAbi, signer);
        setMkpContract(prev => ({ ...prev, contractInstance: mkpInstance }));

        console.log("Contracts initialized with signer (full functionality)");
      } catch (err) {
        console.error("Error initializing contracts with signer:", err);
        throw err;
      }
    }

    initContracts();

  }, [isClient]);

  const fetchBalance = async (receiverAddress: string): Promise<string> => {
    if (!tokenContract.contractInstance) {
      console.error("Token contract not initialized");
      return "0";
    }

    // Validate address format
    if (!receiverAddress || receiverAddress === "" || !ethers.isAddress(receiverAddress)) {
      console.error("Invalid address provided:", receiverAddress);
      return "0";
    }

    try {
      console.log("Fetching balance for address:", receiverAddress);
      console.log("Using contract at address:", tokenContract.address);

      const eth = (window as any).ethereum;
      if (!eth) {
        console.error("Ethereum provider not available");
        return "0";
      }

      const provider = new ethers.BrowserProvider(eth);
      const token = tokenContract.contractInstance;

      // Check network and contract deployment
      try {
        // Check current network
        const network = await provider.getNetwork();
        console.log("Current network:", network.name, "Chain ID:", network.chainId.toString());

        // Sepolia testnet has Chain ID 11155111
        const expectedChainId = BigInt(11155111); // Sepolia testnet
        if (network.chainId !== expectedChainId) {
          const error = `Wrong network! Connected to ${network.name} (Chain ID: ${network.chainId}), but contracts are deployed on Sepolia testnet (Chain ID: ${expectedChainId}). Please switch to Sepolia testnet in MetaMask.`;
          console.error(error);
          toast({
            title: "Wrong Network",
            description: "Please switch to Sepolia testnet in MetaMask.",
            variant: "destructive",
          });
          return "0";
        }

        // Check if contract is deployed
        const code = await provider.getCode(tokenContract.address);
        console.log("Contract bytecode length:", code.length);

        if (code === "0x") {
          console.error(`No contract deployed at address ${tokenContract.address} on Sepolia testnet`);
          toast({
            title: "Contract Not Found",
            description: "The token contract is not deployed on the current network.",
            variant: "destructive",
          });
          return "0";
        }

        console.log("Contract verified and deployed");
      } catch (networkErr) {
        console.error("Network check failed:", networkErr);
        return "0";
      }

      // Try to fetch balance with proper error handling
      try {
        console.log("Calling balanceOf function...");
        const balanceWei = await token.balanceOf(receiverAddress);
        console.log("Balance in wei:", balanceWei.toString());

        const balanceEther = ethers.formatEther(balanceWei);
        console.log("Balance in ether:", balanceEther);

        setBalance(balanceEther);
        return balanceEther;

      } catch (balanceErr: any) {
        console.error("Balance call failed:", balanceErr);

        // If it's a BAD_DATA error, the contract might not be properly deployed or ABI mismatch
        if (balanceErr.code === "BAD_DATA" || balanceErr.reason === "BAD_DATA") {
          console.error("BAD_DATA error - possible ABI mismatch or contract not deployed");
          toast({
            title: "Contract Error",
            description: "There's an issue with the contract deployment or ABI. Please check the network and contract address.",
            variant: "destructive",
          });
          return "0";
        }

        throw balanceErr;
      }

    } catch (err: any) {
      console.error("Error fetching balance:", err);
      console.error("Error details:", {
        message: err.message,
        code: err.code,
        data: err.data,
        reason: err.reason
      });

      // Only show toast if it's not a network error (we already handled that)
      if (!err.message?.includes("Wrong network")) {
        toast({
          title: "Error",
          description: "Failed to fetch token balance. Please check your network connection and try again.",
          variant: "destructive",
        });
      }
      return "0";
    }
  }

  useEffect(() => {
    const makeSureFetchBalanceAfterContractsInit = async () => {
      if (tokenContract.contractInstance && account && ethers.isAddress(account)) {
        console.log("Attempting to fetch balance for account:", account);
        console.log("Token contract address:", tokenContract.address);

        // Add a small delay to ensure contracts are fully initialized
        setTimeout(async () => {
          try {
            await fetchBalance(account);
          } catch (error) {
            console.error("Error in useEffect fetchBalance:", error);
          }
        }, 1000);
      } else {
        console.log("Contracts or account not ready yet:", {
          tokenContract: !!tokenContract.contractInstance,
          mkpContract: !!mkpContract.contractInstance,
          account: !!account,
          validAddress: account ? ethers.isAddress(account) : false
        });
      }
    }

    makeSureFetchBalanceAfterContractsInit();
  }, [tokenContract.contractInstance, mkpContract.contractInstance, account]);
  // Fetch token price from contract



  //implementing the context functions

  const buyTokens = async (amount: number, receiverAddr: string) => {
    //function to buy tokens from the marketplace
    if (!mkpContract.contractInstance) {
      throw new Error("Marketplace contract not initialized");
    }

    try {
      setLoading(true);
      const mkp = mkpContract.contractInstance;


      const tokenAmount = BigInt(amount);
      // 1 SynTK = 1e14 wei (0.0001 ETH), so cost = amount * 1e14 (as per my calculation) (nerd)
      const costInWei = BigInt(amount) * BigInt("100000000000000"); // 1e14 wei per token
      const cost = costInWei;


      const tx = await mkp.buyTokens(tokenAmount, receiverAddr, {
        value: cost
      });

      await tx.wait();

      toast({
        title: "Tokens Purchased",
        description: `Successfully purchased ${amount} SynTK tokens for ${ethers.formatEther(cost.toString())} ETH (${amount * 0.0001} ETH).`,
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
      switchToSepolia,
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