import { Router } from "express";
import {
  createDataSet,
  getDataSets,
  getDataSetByIdOrOwner,
  purchaseDataSet,
  updateDataSet,
} from "../controller/dataSetControlller";

const router = Router();

// Dataset routes
router.post("/datasets", createDataSet);
router.get("/datasets", getDataSets);
router.get("/datasets/owner/:ownerAddress", getDataSetByIdOrOwner);
router.get("/datasets/:id", getDataSetByIdOrOwner);
router.patch("/datasets/:id", updateDataSet);
router.patch("/datasets/:dataSetId/purchase", purchaseDataSet);

export default router;
