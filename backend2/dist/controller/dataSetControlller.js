"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.updateDataSet = exports.purchaseDataSet = exports.getDataSetByIdOrOwner = exports.getDataSets = exports.createDataSet = void 0;
const drizzle_orm_1 = require("drizzle-orm");
const connectDB_1 = require("../config/connectDB");
const DataSetModel_1 = require("../models/DataSetModel");
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
            file_size: input.file_size,
            file_type: input.file_type,
            owner_address: input.owner_address,
            price: Number(input.price), // Convert string price to number
            blockchain_pool_id: input.blockchain_pool_id
                ? Number(input.blockchain_pool_id)
                : null,
            created_at: new Date(),
            updated_at: new Date(),
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
        if (allDatasets.length === 0) {
            return res.status(404).json({ message: "No datasets found" });
        }
        return res.status(200).json(allDatasets);
    }
    catch (error) {
        return res
            .status(500)
            .json({ message: error.message || "Failed to fetch datasets" });
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
            if (dataSetsByOwner.length > 0) {
                return res.status(200).json({
                    success: true,
                    data: dataSetsByOwner,
                });
            }
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
const purchaseDataSet = async (req, res) => {
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
            return res.status(500).json({
                success: false,
                message: "Dataset already purchased by this address",
            });
        }
        const updatedPurchasers = [...currentPurchasers, purchaserAddress];
        //updating the dbs purchasers array
        const [updatedDataSet] = await connectDB_1.db //we are using [] to destructure as drizzle is doing .returning, this will automatically place the first instance from the array into the variable
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
        });
    }
    catch (err) {
        console.error("Error while purchasing the dataset with dataset id: ", dataSetId);
        return res.status(500).json({
            success: false,
            message: err.message || "error while processing of dataset purchasing",
        });
    }
};
exports.purchaseDataSet = purchaseDataSet;
// Add update function for blockchain ID
const updateDataSet = async (req, res) => {
    const { id } = req.params;
    const updates = req.body;
    try {
        if (!id || isNaN(Number(id))) {
            return res.status(400).json({ message: "Invalid dataset ID" });
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
        return res.status(500).json({
            message: error.message || "Failed to update dataset",
        });
    }
};
exports.updateDataSet = updateDataSet;
//# sourceMappingURL=dataSetControlller.js.map