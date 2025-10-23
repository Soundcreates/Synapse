import { toast } from "sonner";
import { fetchData } from "./baseUrl";

type DataPool = {
  id?: string;
  name: string;
  description?: string;
  price?: string;
  ipfs_hash: string;
  file_size: number;
  file_type: string;
  owner_address: string;
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
    price: "12",
    owner_address: "0x1234567890abcdef1234567890abcdef12345678",
    description: "Hourly observations across 1200 stations (2015-2024).",
    ipfs_hash: "QmDemo1",
    file_size: 1024000,
    file_type: "application/json",
  },
  {
    id: "pool_demo_2",
    name: "Retail Transactions (Synthetic)",
    price: "9",
    owner_address: "0xabcdefabcdefabcdefabcdefabcdefabcdefabcd",
    description: "10M rows of anonymized SKU-level detail.",
    ipfs_hash: "QmDemo2",
    file_size: 2048000,
    file_type: "text/csv",
  },
  {
    id: "pool_demo_3",
    name: "Mobility Patterns EU",
    price: "15",
    owner_address: "0x9999999999999999999999999999999999999999",
    description: "Aggregated device movement trends (2020-2023).",
    ipfs_hash: "QmDemo3",
    file_size: 3072000,
    file_type: "application/json",
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
    const response = await fetchData.get(`/pinata/${cid}`);
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

export async function getUserDashboard(
  walletAddress: string
): Promise<{ myPools: DataPool[]; purchases: Purchase[] }> {
  // Simulate API call
  console.log("Fetching user dashboard for:", walletAddress);

  // Mock data for user pools
  const myPools = pools.filter(
    (pool) => pool.owner_address.toLowerCase() === walletAddress.toLowerCase()
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
