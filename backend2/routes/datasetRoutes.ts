import { Router } from "express";
import {
  createDataSet,
  getDataSets,
  getDataSetByIdOrOwner,
  getBlockchainPoolId,
  confirmPurchase,
  updateDataSet,
} from "../controller/dataSetControlller";

const router = Router();

// Dataset routes
router.post("/datasets", createDataSet);
router.get("/datasets", getDataSets);
router.get("/datasets/owner/:ownerAddress", getDataSetByIdOrOwner);
router.get("/datasets/:id", getDataSetByIdOrOwner);
router.patch("/datasets/:id", updateDataSet);
router.post("/datasets/:dataSetId/get-pool-id", getBlockchainPoolId);
router.patch("/datasets/:dataSetId/confirm-purchase", confirmPurchase);

export default router;
