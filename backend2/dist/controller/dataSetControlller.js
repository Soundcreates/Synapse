"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.updateDataSet = exports.confirmPurchase = exports.checkAndFixBlockchainPools = exports.getBlockchainPoolId = exports.getDataSetByIdOrOwner = exports.getDataSets = exports.createDataSet = void 0;
const drizzle_orm_1 = require("drizzle-orm");
const connectDB_1 = require("../config/connectDB");
const DataSetModel_1 = require("../models/DataSetModel");
const ethers_1 = require("ethers");
const createDataSet = async (req, res) => {
    console.log("Welcome to create dataset factory");
    const input = req.body;
    console.log("Received body: ", input);
    console.log("ipfs_hash of file: ", input.ipfs_hash);
    try {
        if (!input.name ||
            !input.ipfs_hash ||
            !input.owner_address ||
            !input.price) {
            return res.status(400).json({
                message: "Missing required fields: name, ipfs_hash, owner_address, price",
            });
        }
        //checking if a dataset with the same name and owner already exists
        console.log("Checking if existing db exists");
        const existingDataset = await connectDB_1.db
            .select()
            .from(DataSetModel_1.datasets)
            .where((0, drizzle_orm_1.and)((0, drizzle_orm_1.ilike)(DataSetModel_1.datasets.name, input.name), (0, drizzle_orm_1.ilike)(DataSetModel_1.datasets.owner_address, input.owner_address)));
        if (existingDataset.length > 0) {
            return res.status(400).json({
                message: "Dataset with the same name already exists for this owner.",
            });
        }
        console.log("Making a new dataset at backend in db");
        const [newDataset] = await connectDB_1.db
            .insert(DataSetModel_1.datasets)
            .values({
            name: input.name,
            description: input.description,
            ipfs_hash: input.ipfs_hash,
            tx_hash: input.tx_hash || null, // Handle undefined tx_hash
            file_size: input.file_size,
            file_type: input.file_type,
            owner_address: input.owner_address,
            price: Number(input.price), // Convert string price to number
            blockchain_pool_id: input.blockchain_pool_id
                ? Number(input.blockchain_pool_id)
                : null,
        })
            .returning();
        console.log("its been stored");
        return res.status(201).json({
            success: true,
            data: newDataset,
        });
    }
    catch (error) {
        console.error("Error creating dataset:", error);
        return res.status(500).json({
            message: error.message || "Failed to create dataset",
        });
    }
};
exports.createDataSet = createDataSet;
const getDataSets = async (req, res) => {
    try {
        const allDatasets = await connectDB_1.db
            .select()
            .from(DataSetModel_1.datasets)
            .orderBy((0, drizzle_orm_1.desc)(DataSetModel_1.datasets.created_at));
        console.log("datasets being sent: ", allDatasets);
        return res.status(200).json({
            success: true,
            allDatasets: allDatasets,
        });
    }
    catch (error) {
        console.error("Error fetching datasets:", error);
        return res.status(500).json({
            success: false,
            message: error.message || "Failed to fetch datasets",
            allDatasets: [],
        });
    }
};
exports.getDataSets = getDataSets;
const getDataSetByIdOrOwner = async (req, res) => {
    const { id, ownerAddress } = req.params;
    //we first fetch from id, if none we fetch from owneraddress
    //we fetch the first dataset found from id
    //we fetch all the datasets found from ownerAddress
    try {
        let dataset;
        if (id && !isNaN(Number(id))) {
            const dataSetById = await connectDB_1.db
                .select()
                .from(DataSetModel_1.datasets)
                .where((0, drizzle_orm_1.eq)(DataSetModel_1.datasets.id, Number(id)));
            dataset = dataSetById[0];
        }
        //if no dataset found by id, we go for owneraddress search (oas) new algo
        if (!dataset && ownerAddress) {
            const dataSetsByOwner = await connectDB_1.db
                .select()
                .from(DataSetModel_1.datasets)
                .where((0, drizzle_orm_1.ilike)(DataSetModel_1.datasets.owner_address, ownerAddress))
                .orderBy((0, drizzle_orm_1.desc)(DataSetModel_1.datasets.created_at));
            //tracking and sending the datasets that the ownerAddress has purchased
            const dataSetsPurchasedList = await connectDB_1.db.select().from(DataSetModel_1.datasets);
            const dataSetsPurchasedByowner = dataSetsPurchasedList.filter((dataSet) => {
                return (Array.isArray(dataSet.purchasers) &&
                    dataSet.purchasers.includes(ownerAddress));
            });
            console.log("Datasets uploaded by owner: ", dataSetsByOwner);
            console.log("datasets purchased by owners: ", dataSetsPurchasedByowner);
            // Return data even if one of the arrays is empty
            return res.status(200).json({
                success: true,
                dataSetsUploaded: dataSetsByOwner,
                dataSetsPurchased: dataSetsPurchasedByowner,
            });
        }
        //but if dataset found by id, here is the returning shi
        if (dataset) {
            return res.status(200).json({
                success: true,
                data: dataset,
            });
        }
        //if no datasets found
        return res.status(404).json({
            success: false,
            message: "No dataset found with the given id or owner address",
        });
    }
    catch (err) {
        console.error("Error fetching dataset by id or owner:", err);
        return res.status(500).json({
            success: false,
            message: err.message || "Failed to fetch dataset by id or owner",
        });
    }
};
exports.getDataSetByIdOrOwner = getDataSetByIdOrOwner;
const getBlockchainPoolId = async (req, res) => {
    const { dataSetId } = req.params;
    const { purchaserAddress } = req.body;
    try {
        if (!dataSetId || isNaN(Number(dataSetId))) {
            return res.status(400).json({ message: "Invalid or missing dataset id" });
        }
        if (!purchaserAddress) {
            return res.status(400).json({ message: "Missing purchaser address" });
        }
        const [dataSet] = await connectDB_1.db
            .select()
            .from(DataSetModel_1.datasets)
            .where((0, drizzle_orm_1.eq)(DataSetModel_1.datasets.id, Number(dataSetId)));
        if (!dataSet) {
            console.error("data set doesn't exist");
            return res.status(404).json({
                success: false,
                message: "data set doesnt exist",
            });
        }
        const currentPurchasers = dataSet.purchasers || [];
        if (currentPurchasers.includes(purchaserAddress)) {
            console.error("Dataset already purchased by this address");
            return res.status(400).json({
                success: false,
                message: "Dataset already purchased by this address",
            });
        }
        // Only return the blockchain_pool_id without updating purchasers
        return res.status(200).json({
            success: true,
            blockchain_pool_id: dataSet.blockchain_pool_id,
            dataSet: {
                id: dataSet.id,
                name: dataSet.name,
                price: dataSet.price,
                owner_address: dataSet.owner_address,
            },
        });
    }
    catch (err) {
        console.error("Error while getting blockchain pool id for dataset id: ", dataSetId);
        return res.status(500).json({
            success: false,
            message: err.message || "error while getting blockchain pool id",
        });
    }
};
exports.getBlockchainPoolId = getBlockchainPoolId;
// Add function to check and fix blockchain pool status
const checkAndFixBlockchainPools = async (req, res) => {
    try {
        console.log("Starting blockchain pool validation and fix process...");
        // Get all datasets from database
        const allDatasets = await connectDB_1.db.select().from(DataSetModel_1.datasets);
        if (!allDatasets || allDatasets.length === 0) {
            return res.status(200).json({
                success: true,
                message: "No datasets found to validate",
                fixed: 0,
                total: 0,
            });
        }
        // Contract details for validation
        const contractAddress = "0x2B800Ea5d5114e09c25344A884624ddf9ca570d2";
        const contractAbi = [
            "function getDataPool(uint256 _poolId) external view returns(address creator, string memory ipfsHash, string memory metadataHash, uint256 pricePerAccess, uint256 totalContributors, bool isActive)",
            "function nextPoolId() external view returns(uint256)",
        ];
        let provider;
        let contract;
        try {
            // Try to connect to blockchain (using Sepolia testnet)
            provider = new ethers_1.ethers.JsonRpcProvider("https://sepolia.infura.io/v3/YOUR_INFURA_KEY");
            contract = new ethers_1.ethers.Contract(contractAddress, contractAbi, provider);
        }
        catch (error) {
            console.log("Blockchain connection failed, proceeding with database-only validation");
            // Just reset datasets with null blockchain_pool_id for now
            const datasetsToFix = allDatasets.filter((dataset) => dataset.blockchain_pool_id === null ||
                dataset.blockchain_pool_id === undefined);
            return res.status(200).json({
                success: true,
                message: "Blockchain connection unavailable, found datasets needing pool creation",
                needsPoolCreation: datasetsToFix.length,
                total: allDatasets.length,
                datasetsNeedingPools: datasetsToFix.map((d) => ({
                    id: d.id,
                    name: d.name,
                    owner_address: d.owner_address,
                })),
            });
        }
        let fixedCount = 0;
        const problematicDatasets = [];
        for (const dataset of allDatasets) {
            try {
                if (dataset.blockchain_pool_id === null ||
                    dataset.blockchain_pool_id === undefined) {
                    problematicDatasets.push({
                        id: dataset.id,
                        name: dataset.name,
                        issue: "No blockchain pool ID",
                        action: "Needs pool creation",
                    });
                    continue;
                }
                // Check if pool exists and is active on blockchain
                try {
                    const poolData = await contract.getDataPool(dataset.blockchain_pool_id);
                    const isActive = poolData[5]; // isActive is the 6th element
                    if (!isActive) {
                        // Pool exists but is inactive - reset the blockchain_pool_id
                        await connectDB_1.db
                            .update(DataSetModel_1.datasets)
                            .set({
                            blockchain_pool_id: null,
                            updated_at: new Date(),
                        })
                            .where((0, drizzle_orm_1.eq)(DataSetModel_1.datasets.id, dataset.id));
                        fixedCount++;
                        problematicDatasets.push({
                            id: dataset.id,
                            name: dataset.name,
                            issue: "Pool inactive",
                            action: "Reset to null for recreation",
                        });
                    }
                }
                catch (poolError) {
                    // Pool doesn't exist or other error - reset the blockchain_pool_id
                    if (poolError.message.includes("revert") ||
                        poolError.message.includes("invalid")) {
                        await connectDB_1.db
                            .update(DataSetModel_1.datasets)
                            .set({
                            blockchain_pool_id: null,
                            updated_at: new Date(),
                        })
                            .where((0, drizzle_orm_1.eq)(DataSetModel_1.datasets.id, dataset.id));
                        fixedCount++;
                        problematicDatasets.push({
                            id: dataset.id,
                            name: dataset.name,
                            issue: "Pool not found on blockchain",
                            action: "Reset to null for recreation",
                        });
                    }
                }
            }
            catch (error) {
                console.error(`Error checking dataset ${dataset.id}:`, error);
                problematicDatasets.push({
                    id: dataset.id,
                    name: dataset.name,
                    issue: "Validation error",
                    action: "Manual review needed",
                });
            }
        }
        return res.status(200).json({
            success: true,
            message: "Blockchain pool validation completed",
            total: allDatasets.length,
            fixed: fixedCount,
            problematicDatasets: problematicDatasets,
        });
    }
    catch (error) {
        console.error("Error in blockchain pool validation:", error);
        return res.status(500).json({
            success: false,
            message: error.message || "Failed to validate blockchain pools",
        });
    }
};
exports.checkAndFixBlockchainPools = checkAndFixBlockchainPools;
const confirmPurchase = async (req, res) => {
    const { dataSetId } = req.params;
    const { purchaserAddress, transactionHash } = req.body;
    try {
        if (!dataSetId || isNaN(Number(dataSetId))) {
            return res.status(400).json({ message: "Invalid or missing dataset id" });
        }
        if (!purchaserAddress) {
            return res.status(400).json({ message: "Missing purchaser address" });
        }
        if (!transactionHash) {
            return res.status(400).json({ message: "Missing transaction hash" });
        }
        const [dataSet] = await connectDB_1.db
            .select()
            .from(DataSetModel_1.datasets)
            .where((0, drizzle_orm_1.eq)(DataSetModel_1.datasets.id, Number(dataSetId)));
        if (!dataSet) {
            console.error("data set doesn't exist");
            return res.status(404).json({
                success: false,
                message: "data set doesnt exist",
            });
        }
        const currentPurchasers = dataSet.purchasers || [];
        if (currentPurchasers.includes(purchaserAddress)) {
            console.error("Dataset already purchased by this address");
            return res.status(400).json({
                success: false,
                message: "Dataset already purchased by this address",
            });
        }
        const updatedPurchasers = [...currentPurchasers, purchaserAddress];
        // Update the database with purchaser and transaction hash
        const [updatedDataSet] = await connectDB_1.db
            .update(DataSetModel_1.datasets)
            .set({
            purchasers: updatedPurchasers,
            updated_at: new Date(),
        })
            .where((0, drizzle_orm_1.eq)(DataSetModel_1.datasets.id, Number(dataSetId)))
            .returning();
        return res.status(200).json({
            success: true,
            dataSetPurchased: updatedDataSet,
            message: "Purchase confirmed successfully",
        });
    }
    catch (err) {
        console.error("Error while confirming purchase for dataset id: ", dataSetId);
        return res.status(500).json({
            success: false,
            message: err.message || "error while confirming purchase",
        });
    }
};
exports.confirmPurchase = confirmPurchase;
// Helper function to get next available blockchain_pool_id
const getNextBlockchainPoolId = async () => {
    const lastDataset = await connectDB_1.db
        .select({ blockchain_pool_id: DataSetModel_1.datasets.blockchain_pool_id })
        .from(DataSetModel_1.datasets)
        .where((0, drizzle_orm_1.isNotNull)(DataSetModel_1.datasets.blockchain_pool_id))
        .orderBy((0, drizzle_orm_1.desc)(DataSetModel_1.datasets.blockchain_pool_id))
        .limit(1);
    return lastDataset.length > 0
        ? (lastDataset[0].blockchain_pool_id || 0) + 1
        : 1;
};
// Add update function for blockchain ID
const updateDataSet = async (req, res) => {
    const { id } = req.params;
    const updates = req.body;
    try {
        if (!id || isNaN(Number(id))) {
            return res.status(400).json({ message: "Invalid dataset ID" });
        }
        // If blockchain_pool_id is being updated, handle it carefully
        if (updates.blockchain_pool_id !== undefined &&
            updates.blockchain_pool_id !== null) {
            // Check if the provided blockchain_pool_id already exists for a different dataset
            const existingDataset = await connectDB_1.db
                .select()
                .from(DataSetModel_1.datasets)
                .where((0, drizzle_orm_1.eq)(DataSetModel_1.datasets.blockchain_pool_id, updates.blockchain_pool_id))
                .limit(1);
            if (existingDataset.length > 0 && existingDataset[0].id !== Number(id)) {
                // Generate a new unique blockchain_pool_id instead of rejecting
                const nextPoolId = await getNextBlockchainPoolId();
                updates.blockchain_pool_id = nextPoolId;
                console.log(`Blockchain pool ID ${req.body.blockchain_pool_id} already exists, assigned new ID: ${nextPoolId}`);
            }
        }
        const [updatedDataSet] = await connectDB_1.db
            .update(DataSetModel_1.datasets)
            .set({
            ...updates,
            updated_at: new Date(),
        })
            .where((0, drizzle_orm_1.eq)(DataSetModel_1.datasets.id, Number(id)))
            .returning();
        if (!updatedDataSet) {
            return res.status(404).json({ message: "Dataset not found" });
        }
        return res.status(200).json({
            success: true,
            data: updatedDataSet,
        });
    }
    catch (error) {
        console.error("Error updating dataset:", error);
        // Handle specific constraint violation errors
        if (error.code === "23505" &&
            error.constraint === "datasets_blockchain_pool_id_unique") {
            try {
                // Retry with a new blockchain_pool_id
                const nextPoolId = await getNextBlockchainPoolId();
                const retryUpdates = { ...updates, blockchain_pool_id: nextPoolId };
                const [retryUpdatedDataSet] = await connectDB_1.db
                    .update(DataSetModel_1.datasets)
                    .set({
                    ...retryUpdates,
                    updated_at: new Date(),
                })
                    .where((0, drizzle_orm_1.eq)(DataSetModel_1.datasets.id, Number(id)))
                    .returning();
                console.log(`Retry successful with new blockchain_pool_id: ${nextPoolId}`);
                return res.status(200).json({
                    success: true,
                    data: retryUpdatedDataSet,
                    message: `Dataset updated with new blockchain pool ID: ${nextPoolId}`,
                });
            }
            catch (retryError) {
                console.error("Retry failed:", retryError);
                return res.status(500).json({
                    message: "Failed to update dataset even after retry",
                });
            }
        }
        return res.status(500).json({
            message: error.message || "Failed to update dataset",
        });
    }
};
exports.updateDataSet = updateDataSet;
//# sourceMappingURL=dataSetControlller.js.map