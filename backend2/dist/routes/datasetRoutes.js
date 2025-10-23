"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const dataSetControlller_1 = require("../controller/dataSetControlller");
const router = (0, express_1.Router)();
// Dataset routes
router.post("/datasets", dataSetControlller_1.createDataSet);
router.get("/datasets", dataSetControlller_1.getDataSets);
router.get("/datasets/:id", dataSetControlller_1.getDataSetByIdOrOwner);
router.get("/datasets/owner/:ownerAddress", dataSetControlller_1.getDataSetByIdOrOwner);
router.patch("/datasets/:id", dataSetControlller_1.updateDataSet);
router.patch("/datasets/:dataSetId/purchase", dataSetControlller_1.purchaseDataSet);
exports.default = router;
//# sourceMappingURL=datasetRoutes.js.map