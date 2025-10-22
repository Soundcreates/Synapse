import { toast } from "sonner";
import { fetchData } from "./baseUrl";

type DataPool = {
  id: string;
  name: string;
  price: number;
  owner: string;
  cid?: string;
  description?: string;
};

type Purchase = {
  id: string;
  poolId: string;
  wallet: string;
  date: string;
  pool?: DataPool;
};

// In-memory stores (frontend-only simulation)
const pools: DataPool[] = [
  {
    id: "pool_demo_1",
    name: "Global Weather Dataset",
    price: 12,
    owner: "0x1234567890abcdef1234567890abcdef12345678",
    description: "Hourly observations across 1200 stations (2015-2024).",
  },
  {
    id: "pool_demo_2",
    name: "Retail Transactions (Synthetic)",
    price: 9,
    owner: "0xabcdefabcdefabcdefabcdefabcdefabcdefabcd",
    description: "10M rows of anonymized SKU-level detail.",
  },
  {
    id: "pool_demo_3",
    name: "Mobility Patterns EU",
    price: 15,
    owner: "0x9999999999999999999999999999999999999999",
    description: "Aggregated device movement trends (2020-2023).",
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
      toast.success("File uploaded to IPFS successfully");
      window.location.href = "/dashboard";
      return { cid: response.data.cid };
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
    const response = await fetchData.get(`/pinata/${cid}`);
    if (response.status === 200) {
      console.log("File fetched from IPFS successfully");
      if (!response.data.link || response.data.link === "") {
        console.error("No link found for the given CID");
        return "";
      }
      const fileUrl = response.data.link;
      return fileUrl;
    }
  } catch (err) {
    console.error("Error fetching file from IPFS:", err);
  }

  return "";
}

export async function getUserDashboard(
  walletAddress: string
): Promise<{ myPools: DataPool[]; purchases: Purchase[] }> {
  // Simulate API call
  console.log("Fetching user dashboard for:", walletAddress);

  // Mock data for user pools
  const myPools = pools.filter(
    (pool) => pool.owner.toLowerCase() === walletAddress.toLowerCase()
  );

  // Mock data for purchases
  const purchases: Purchase[] = [
    {
      id: "purchase_1",
      poolId: "pool_demo_1",
      wallet: walletAddress,
      date: new Date(Date.now() - 86400000).toISOString(), // 1 day ago
    },
    {
      id: "purchase_2",
      poolId: "pool_demo_2",
      wallet: walletAddress,
      date: new Date(Date.now() - 172800000).toISOString(), // 2 days ago
    },
  ];

  return { myPools, purchases };
}

export async function getMarketplace(): Promise<DataPool[]> {
  // Simulate API call
  console.log("Fetching marketplace data");

  // Return all available pools
  return pools;
}

export async function purchaseDataAccess(
  poolId: string,
  walletAddress: string
): Promise<Purchase> {
  // Simulate API call
  console.log(
    "Purchasing data access for pool:",
    poolId,
    "by wallet:",
    walletAddress
  );

  const purchase: Purchase = {
    id: `purchase_${Date.now()}`,
    poolId,
    wallet: walletAddress,
    date: new Date().toISOString(),
  };

  return purchase;
}
