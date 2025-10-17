import { toast } from "react-toastify";
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
    const response = await fetchData.post("/upload", _file);
    if (response.status === 200) {
      toast.success("File uploaded to IPFS successfully");
    }
    return { cid: response.data.cid };
  } catch (err) {
    console.error("Error uploading file to IPFS:", err);
    toast.error("Failed to upload file to IPFS");
  }
  console.log("Uploading file, has been completed");
  return { cid: "bafybeigdyrzt5tqz5..." };
}

export async function fetchDocument(cid: string): Promise<string> {
  console.log("Fetching file from IPFS with CID: ", cid);

  try {
    const response = await fetchData.get(`/pinata/${cid}`);
    if (response.status === 200) {
      toast.success("File fetched from IPFS successfully");
      if (!response.data.link || response.data.link === "")
        toast.error("No link found for the given CID");
      const fileUrl = response.data.link;
      return fileUrl;
    }
  } catch (err) {
    toast.error("Failed to fetch file from IPFS");
    console.error("Error fetching file from IPFS:", err);
  }

  return "";
}
