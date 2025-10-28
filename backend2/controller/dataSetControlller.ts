import { Request, Response } from "express";
import { eq, ilike, desc, and, isNotNull } from "drizzle-orm";
import { db } from "../config/connectDB";
import {
  datasets,
  DataSet,
  CreateDataSetInput,
  NewDataSet,
} from "../models/DataSetModel";

export const createDataSet = async (
  req: Request,
  res: Response,
): Promise<Response> => {
  console.log("Welcome to create dataset factory");
  const input: CreateDataSetInput = req.body;
  console.log("Received body: ", input);
  console.log("ipfs_hash of file: ", input.ipfs_hash);
  try {
    if (
      !input.name ||
      !input.ipfs_hash ||
      !input.owner_address ||
      !input.price
    ) {
      return res.status(400).json({
        message:
          "Missing required fields: name, ipfs_hash, owner_address, price",
      });
    }

    //checking if a dataset with the same name and owner already exists
    console.log("Checking if existing db exists");
    const existingDataset = await db
      .select()
      .from(datasets)
      .where(
        and(
          ilike(datasets.name, input.name),
          ilike(datasets.owner_address, input.owner_address),
        ),
      );

    if (existingDataset.length > 0) {
      return res.status(400).json({
        message: "Dataset with the same name already exists for this owner.",
      });
    }

    console.log("Making a new dataset at backend in db");
    const [newDataset] = await db
      .insert(datasets)
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
  } catch (error: any) {
    console.error("Error creating dataset:", error);
    return res.status(500).json({
      message: error.message || "Failed to create dataset",
    });
  }
};

export const getDataSets = async (
  req: Request,
  res: Response,
): Promise<Response> => {
  try {
    const allDatasets = await db
      .select()
      .from(datasets)
      .orderBy(desc(datasets.created_at));

    console.log("datasets being sent: ", allDatasets);

    return res.status(200).json({
      success: true,
      allDatasets: allDatasets,
    });
  } catch (error: any) {
    console.error("Error fetching datasets:", error);
    return res.status(500).json({
      success: false,
      message: error.message || "Failed to fetch datasets",
      allDatasets: [],
    });
  }
};

export const getDataSetByIdOrOwner = async (
  req: Request,
  res: Response,
): Promise<Response> => {
  const { id, ownerAddress } = req.params;
  //we first fetch from id, if none we fetch from owneraddress
  //we fetch the first dataset found from id
  //we fetch all the datasets found from ownerAddress
  try {
    let dataset: DataSet | undefined;

    if (id && !isNaN(Number(id))) {
      const dataSetById = await db
        .select()
        .from(datasets)
        .where(eq(datasets.id, Number(id)));

      dataset = dataSetById[0];
    }

    //if no dataset found by id, we go for owneraddress search (oas) new algo
    if (!dataset && ownerAddress) {
      const dataSetsByOwner = await db
        .select()
        .from(datasets)
        .where(ilike(datasets.owner_address, ownerAddress))
        .orderBy(desc(datasets.created_at));

      //tracking and sending the datasets that the ownerAddress has purchased
      const dataSetsPurchasedList = await db.select().from(datasets);
      const dataSetsPurchasedByowner = dataSetsPurchasedList.filter(
        (dataSet) => {
          return (
            Array.isArray(dataSet.purchasers) &&
            dataSet.purchasers.includes(ownerAddress)
          );
        },
      );
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
  } catch (err: any) {
    console.error("Error fetching dataset by id or owner:", err);
    return res.status(500).json({
      success: false,
      message: err.message || "Failed to fetch dataset by id or owner",
    });
  }
};

export const getBlockchainPoolId = async (
  req: Request,
  res: Response,
): Promise<Response> => {
  const { dataSetId } = req.params;
  const { purchaserAddress } = req.body;

  try {
    if (!dataSetId || isNaN(Number(dataSetId))) {
      return res.status(400).json({ message: "Invalid or missing dataset id" });
    }
    if (!purchaserAddress) {
      return res.status(400).json({ message: "Missing purchaser address" });
    }

    const [dataSet] = await db
      .select()
      .from(datasets)
      .where(eq(datasets.id, Number(dataSetId)));

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
  } catch (err: any) {
    console.error(
      "Error while getting blockchain pool id for dataset id: ",
      dataSetId,
    );
    return res.status(500).json({
      success: false,
      message: err.message || "error while getting blockchain pool id",
    });
  }
};

export const confirmPurchase = async (
  req: Request,
  res: Response,
): Promise<Response> => {
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

    const [dataSet] = await db
      .select()
      .from(datasets)
      .where(eq(datasets.id, Number(dataSetId)));

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
    const [updatedDataSet] = await db
      .update(datasets)
      .set({
        purchasers: updatedPurchasers,
        updated_at: new Date(),
      })
      .where(eq(datasets.id, Number(dataSetId)))
      .returning();

    return res.status(200).json({
      success: true,
      dataSetPurchased: updatedDataSet,
      message: "Purchase confirmed successfully",
    });
  } catch (err: any) {
    console.error(
      "Error while confirming purchase for dataset id: ",
      dataSetId,
    );
    return res.status(500).json({
      success: false,
      message: err.message || "error while confirming purchase",
    });
  }
};

// Helper function to get next available blockchain_pool_id
const getNextBlockchainPoolId = async (): Promise<number> => {
  const lastDataset = await db
    .select({ blockchain_pool_id: datasets.blockchain_pool_id })
    .from(datasets)
    .where(isNotNull(datasets.blockchain_pool_id))
    .orderBy(desc(datasets.blockchain_pool_id))
    .limit(1);

  return lastDataset.length > 0
    ? (lastDataset[0].blockchain_pool_id || 0) + 1
    : 1;
};

// Add update function for blockchain ID
export const updateDataSet = async (
  req: Request,
  res: Response,
): Promise<Response> => {
  const { id } = req.params;
  const updates = req.body;

  try {
    if (!id || isNaN(Number(id))) {
      return res.status(400).json({ message: "Invalid dataset ID" });
    }

    // If blockchain_pool_id is being updated, handle it carefully
    if (
      updates.blockchain_pool_id !== undefined &&
      updates.blockchain_pool_id !== null
    ) {
      // Check if the provided blockchain_pool_id already exists for a different dataset
      const existingDataset = await db
        .select()
        .from(datasets)
        .where(eq(datasets.blockchain_pool_id, updates.blockchain_pool_id))
        .limit(1);

      if (existingDataset.length > 0 && existingDataset[0].id !== Number(id)) {
        // Generate a new unique blockchain_pool_id instead of rejecting
        const nextPoolId = await getNextBlockchainPoolId();
        updates.blockchain_pool_id = nextPoolId;
        console.log(
          `Blockchain pool ID ${req.body.blockchain_pool_id} already exists, assigned new ID: ${nextPoolId}`,
        );
      }
    }

    const [updatedDataSet] = await db
      .update(datasets)
      .set({
        ...updates,
        updated_at: new Date(),
      })
      .where(eq(datasets.id, Number(id)))
      .returning();

    if (!updatedDataSet) {
      return res.status(404).json({ message: "Dataset not found" });
    }

    return res.status(200).json({
      success: true,
      data: updatedDataSet,
    });
  } catch (error: any) {
    console.error("Error updating dataset:", error);

    // Handle specific constraint violation errors
    if (
      error.code === "23505" &&
      error.constraint === "datasets_blockchain_pool_id_unique"
    ) {
      try {
        // Retry with a new blockchain_pool_id
        const nextPoolId = await getNextBlockchainPoolId();
        const retryUpdates = { ...updates, blockchain_pool_id: nextPoolId };

        const [retryUpdatedDataSet] = await db
          .update(datasets)
          .set({
            ...retryUpdates,
            updated_at: new Date(),
          })
          .where(eq(datasets.id, Number(id)))
          .returning();

        console.log(
          `Retry successful with new blockchain_pool_id: ${nextPoolId}`,
        );

        return res.status(200).json({
          success: true,
          data: retryUpdatedDataSet,
          message: `Dataset updated with new blockchain pool ID: ${nextPoolId}`,
        });
      } catch (retryError: any) {
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
