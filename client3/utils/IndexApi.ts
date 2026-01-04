import { toast } from "sonner";
import { fetchData } from "./baseUrl";

export type DataPool = {
  id: number;
  blockchain_pool_id?: number | null;
  name: string;
  description?: string | null;
  price: number;
  ipfs_hash: string;
  file_size: number;
  file_type?: string | null;
  owner_address: string;
  tx_hash?: string | null;
  purchasers?: string[] | null;
  created_at: string;
  updated_at: string;
};

// In-memory stores (frontend-only simulation)
const pools: DataPool[] = [
  {
    id: 1,
    name: "Global Weather Dataset",
    price: 12,
    owner_address: "0x1234567890abcdef1234567890abcdef12345678",
    description: "Hourly observations across 1200 stations (2015-2024).",
    ipfs_hash: "QmDemo1",
    file_size: 1024000,
    file_type: "application/json",
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: 2,
    name: "Retail Transactions (Synthetic)",
    price: 9,
    owner_address: "0xabcdefabcdefabcdefabcdefabcdefabcdefabcd",
    description: "10M rows of anonymized SKU-level detail.",
    ipfs_hash: "QmDemo2",
    file_size: 2048000,
    file_type: "text/csv",
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: 3,
    name: "Mobility Patterns EU",
    price: 15,
    owner_address: "0x9999999999999999999999999999999999999999",
    description: "Aggregated device movement trends (2020-2023).",
    ipfs_hash: "QmDemo3",
    file_size: 3072000,
    file_type: "application/json",
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
];

export async function uploadToIPFS(_file: File): Promise<{ cid: string }> {
  console.log("Uploading file to IPFS: ", _file);

  try {
    //creating formdata
    const formData = new FormData();
    formData.append("file", _file);

    const response = await fetchData.post("/pinata/upload", formData, {
      headers: {
        "Content-Type": "multipart/form-data",
      },
    });
    if (response.status === 200) {
      console.log("File uploaded to IPFS successfully");
      console.log("Response data:", response.data);
      toast.success("File uploaded to IPFS successfully");

      // The backend returns ipfsHash, not cid
      const cid = response.data.data?.ipfsHash || response.data.ipfsHash;
      if (!cid) {
        console.error("No CID received from backend:", response.data);
        throw new Error("No CID received from IPFS upload");
      }

      return { cid };
    } else {
      console.error("Upload failed with status:", response.status);
      throw new Error("Failed to upload file to IPFS");
    }
  } catch (err) {
    console.error("Error uploading file to IPFS:", err);
    throw new Error("Failed to upload file to IPFS");
  }
}

export async function fetchDocument(cid: string): Promise<string> {
  console.log("Fetching file from IPFS with CID: ", cid);

  try {
    const response = await fetchData.get(`/pinata/fetch/${cid}`);
    if (response.status === 200) {
      console.log("File fetched from IPFS successfully");
      console.log("Fetch response:", response.data);

      const fileUrl =
        response.data.link ||
        response.data.data?.link ||
        `${process.env.PINATA_GATEWAY}/ipfs/${cid}`;

      if (!fileUrl || fileUrl === "") {
        console.error("No link found for the given CID");
        return "";
      }
      return fileUrl;
    }
  } catch (err) {
    console.error("Error fetching file from IPFS:", err);
  }

  return "";
}

export async function getUserDashboard(walletAddress: string): Promise<{
  myPools: DataPool[] | undefined | null;
  purchasedPools: DataPool[] | undefined | null;
}> {
  // Simulate API call
  console.log("Fetching dashboard for wallet: ", walletAddress);

  try {
    const dataPoolResponseFromBackend = await fetchData.get(
      `/datasets/owner/${walletAddress}`,
    );

    console.log("Backend response:", dataPoolResponseFromBackend.data);

    if (dataPoolResponseFromBackend.data.success) {
      //grabbing the datasets uploaded by the owner address
      const dataSetsUploaded =
        dataPoolResponseFromBackend.data.dataSetsUploaded || [];
      console.log("Datasets uploaded:", dataSetsUploaded);

      //grabbing purchases made by the owner address
      const dataSetsPurchased =
        dataPoolResponseFromBackend.data.dataSetsPurchased || [];
      console.log("Datasets purchased:", dataSetsPurchased);

      const dataSetsByOwner: DataPool[] = dataSetsUploaded;
      const dataSetsPurchasedByOwner: DataPool[] = dataSetsPurchased;
      return {
        myPools: dataSetsByOwner,
        purchasedPools: dataSetsPurchasedByOwner,
      };
    }

    // If success is false or response format is unexpected
    console.warn(
      "Unexpected response format:",
      dataPoolResponseFromBackend.data,
    );
    return {
      myPools: [],
      purchasedPools: [],
    };
  } catch (err: any) {
    console.error("Error at getUserDashboard at indexapi.ts");
    console.error("Error details:", err.response?.data || err.message || err);

    // Return empty arrays instead of null to prevent UI errors
    return {
      myPools: [],
      purchasedPools: [],
    };
  }
}

export async function getMarketplace(): Promise<{
  success: boolean;
  dataSetsList: DataPool[];
}> {
  console.log("Fetching marketplace data");
  let dataSetsList: DataPool[] = [];
  try {
    console.log("Making API call to /datasets");
    const fetchResponse = await fetchData.get("/datasets");
    console.log("API Response status:", fetchResponse.status);
    console.log("API Response data:", fetchResponse.data);

    if (fetchResponse.status === 200) {
      // Handle both old format (direct array) and new format (with success property)
      if (fetchResponse.data.success && fetchResponse.data.allDatasets) {
        dataSetsList = fetchResponse.data.allDatasets;
      } else if (Array.isArray(fetchResponse.data)) {
        // Handle direct array response (fallback for old format)
        dataSetsList = fetchResponse.data;
      } else {
        console.warn("Unexpected response format:", fetchResponse.data);
      }

      console.log("datasets being grabbed: ", dataSetsList);
      return { success: true, dataSetsList };
    }
  } catch (err: any) {
    console.error("Error at getMarketplace function:");
    console.error("Error response:", err.response?.data);
    console.error("Error message:", err.message);
    console.error("Error code:", err.code);
    if (err.response) {
      console.error("Response status:", err.response.status);
    }
  }
  return { success: false, dataSetsList };
}

export async function getBlockchainPoolId(
  poolId: number,
  walletAddress: string,
): Promise<{ success: boolean; blockchain_pool_id: number | BigInt }> {
  console.log(
    "Getting blockchain pool ID for pool:",
    poolId,
    "by wallet:",
    walletAddress,
  );

  try {
    const response = await fetchData.post(`/datasets/${poolId}/get-pool-id`, {
      purchaserAddress: walletAddress,
    });

    if (response.status === 200 && response.data.success) {
      console.log(
        "Blockchain pool ID retrieved successfully:",
        response.data.blockchain_pool_id,
      );
      return {
        success: true,
        blockchain_pool_id: response.data.blockchain_pool_id,
      };
    } else {
      throw new Error("Failed to get blockchain pool ID");
    }
  } catch (err: any) {
    console.error(
      "Error getting blockchain pool ID:",
      err.response?.data || err.message,
    );
    return {
      success: false,
      blockchain_pool_id: 0,
    };
  }
}

export async function validateBlockchainPools(): Promise<{
  success: boolean;
  message: string;
  fixed?: number;
  total?: number;
  problematicDatasets?: any[];
}> {
  console.log("Starting blockchain pool validation...");

  try {
    const response = await fetchData.post(
      "/datasets/validate-blockchain-pools",
    );

    if (response.status === 200 && response.data.success) {
      console.log("Blockchain pool validation completed:", response.data);
      return {
        success: true,
        message: response.data.message,
        fixed: response.data.fixed,
        total: response.data.total,
        problematicDatasets: response.data.problematicDatasets,
      };
    } else {
      throw new Error("Failed to validate blockchain pools");
    }
  } catch (err: any) {
    console.error(
      "Error validating blockchain pools:",
      err.response?.data || err.message,
    );
    return {
      success: false,
      message:
        err.response?.data?.message || "Failed to validate blockchain pools",
    };
  }
}

export async function confirmPurchase(
  poolId: number,
  walletAddress: string,
  transactionHash: string,
): Promise<{ success: boolean; dataSetPurchased?: any }> {
  console.log(
    "Confirming purchase for pool:",
    poolId,
    "by wallet:",
    walletAddress,
    "with transaction:",
    transactionHash,
  );

  try {
    const response = await fetchData.patch(
      `/datasets/${poolId}/confirm-purchase`,
      {
        purchaserAddress: walletAddress,
        transactionHash: transactionHash,
      },
    );

    if (response.status === 200 && response.data.success) {
      console.log(
        "Purchase confirmed successfully:",
        response.data.dataSetPurchased,
      );
      return {
        success: true,
        dataSetPurchased: response.data.dataSetPurchased,
      };
    } else {
      throw new Error("Failed to confirm purchase");
    }
  } catch (err: any) {
    console.error(
      "Error confirming purchase:",
      err.response?.data || err.message,
    );
    return {
      success: false,
    };
  }
}
