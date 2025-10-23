"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const pinataController_1 = require("../controller/pinataController");
const uploadMiddleware_1 = require("../middleware/uploadMiddleware");
const pinataRouter = express_1.default.Router();
pinataRouter.post("/upload", uploadMiddleware_1.uploadSingle, pinataController_1.pinataUpload);
pinataRouter.get("/fetch/:cid", pinataController_1.pinataFetch);
exports.default = pinataRouter;
//# sourceMappingURL=pinataRoutes.js.map