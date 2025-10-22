import { Request, Response } from "express";
import { eq, ilike, desc, and } from "drizzle-orm";
import { db } from "../config/connectDB";
import {
  datasets,
  DataSet,
  CreateDataSetInput,
  NewDataSet,
} from "../models/DataSetModel";

export const createDataSet = async (
  req: Request,
  res: Response
): Promise<Response> => {
  const input: CreateDataSetInput = req.body;
  try {
    if (!input.name || !input.ipfs_hash || !input.owner_address) {
      return res.status(400).json({
        message: "Missing required fields: name, ipfs_hash, owner_address",
      });
    }

    //checking if a dataset with the same name and owner already exists
    const existingDataset = await db
      .select()
      .from(datasets)
      .where(
        and(
          ilike(datasets.name, input.name),
          ilike(datasets.owner_address, input.owner_address)
        )
      );

    if (existingDataset.length > 0) {
      return res.status(400).json({
        message: "Dataset with the same name already exists for this owner.",
      });
    }
    const [newDataset] = await db
      .insert(datasets)
      .values({
        ...input, //destructuring the input object
        created_at: new Date(),
        updated_at: new Date(),
      })
      .returning();
    return res.status(200).json(newDataset);
  } catch (error) {
    console.error("Error creating dataset:", error);
    throw new Error("failed to create dataset");
  }
};

export const getDataSets = async (
  req: Request,
  res: Response
): Promise<Response> => {
  try {
    const allDatasets = await db
      .select()
      .from(datasets)
      .orderBy(desc(datasets.created_at));
    if (allDatasets.length === 0) {
      return res.status(404).json({ message: "No datasets found" });
    }

    return res.status(200).json(allDatasets);
  } catch (error: any) {
    return res
      .status(500)
      .json({ message: error.message || "Failed to fetch datasets" });
  }
};

export const getDataSetByIdOrOwner = async (
  req: Request,
  res: Response
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
  } catch (err: any) {
    console.error("Error fetching dataset by id or owner:", err);
    return res.status(500).json({
      success: false,
      message: err.message || "Failed to fetch dataset by id or owner",
    });
  }
};

export const purchaseDataSet = async (
  req: Request,
  res: Response
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
      return res.status(500).json({
        success: false,
        message: "Dataset already purchased by this address",
      });
    }
    const updatedPurchasers = [...currentPurchasers, purchaserAddress];
    //updating the dbs purchasers array
    const [updatedDataSet] = await db //we are using [] to destructure as drizzle is doing .returning, this will automatically place the first instance from the array into the variable
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
    });
  } catch (err: any) {
    console.error(
      "Error while purchasing the dataset with dataset id: ",
      dataSetId
    );
    return res.status(500).json({
      success: false,
      message: err.message || "error while processing of dataset purchasing",
    });
  }
};
