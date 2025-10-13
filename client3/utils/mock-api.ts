type DataPool = {
  id: string
  name: string
  price: number
  owner: string
  cid?: string
  description?: string
}

type Purchase = {
  id: string
  poolId: string
  wallet: string
  date: string
}

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms))

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
]

const purchasesByWallet = new Map<string, Purchase[]>()

function id(prefix: string) {
  return `${prefix}_${Math.random().toString(36).slice(2, 8)}`
}

export async function uploadToIPFS(_file: File): Promise<{ cid: string }> {
  await sleep(600)
  return { cid: `ipfs://${Math.random().toString(36).slice(2, 10)}` }
}

export async function createDataPool(input: {
  name: string
  price: number
  owner: string
  cid?: string
  description?: string
}) {
  await sleep(700)
  const newPool: DataPool = {
    id: id("pool"),
    name: input.name,
    price: input.price,
    owner: input.owner,
    cid: input.cid,
    description: input.description,
  }
  pools.unshift(newPool)
  return newPool
}

export async function getMarketplace(): Promise<DataPool[]> {
  await sleep(400)
  return pools
}

export async function purchaseDataAccess(poolId: string, wallet: string) {
  await sleep(500)
  const purchase: Purchase = { id: id("purchase"), poolId, wallet, date: new Date().toISOString() }
  const arr = purchasesByWallet.get(wallet) ?? []
  arr.unshift(purchase)
  purchasesByWallet.set(wallet, arr)
  return purchase
}

export async function getUserDashboard(wallet: string): Promise<{
  myPools: DataPool[]
  purchases: (Purchase & { pool: DataPool | undefined })[]
}> {
  await sleep(400)
  const myPools = pools.filter((p) => p.owner.toLowerCase() === wallet.toLowerCase())
  const purchases = (purchasesByWallet.get(wallet) ?? []).map((p) => ({
    ...p,
    pool: pools.find((x) => x.id === p.poolId),
  }))
  return { myPools, purchases }
}
