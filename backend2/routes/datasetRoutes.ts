import { Router } from "express";
import {
  createDataSet,
  getDataSets,
  getDataSetByIdOrOwner,
  purchaseDataSet,
} from "../controller/dataSetControlller";

const router = Router();

// Dataset routes
router.post("/datasets", createDataSet);
router.get("/datasets", getDataSets);
router.get("/datasets/:id", getDataSetByIdOrOwner);
router.get("/datasets/owner/:ownerAddress", getDataSetByIdOrOwner);
router.patch("/datasets/:dataSetId/purchase", purchaseDataSet);

export default router;
