import express from "express";
import { pinataUpload, pinataFetch } from "../controller/pinataController";
import { uploadSingle } from "../middleware/uploadMiddleware";

const pinataRouter = express.Router();

pinataRouter.post("/upload", uploadSingle, pinataUpload);
pinataRouter.get("/fetch/:cid", pinataFetch);

export default pinataRouter;
