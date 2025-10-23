"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.uploadSingle = exports.upload = void 0;
const multer_1 = __importDefault(require("multer"));
// Configure multer for memory storage
const storage = multer_1.default.memoryStorage();
// File filter function
const fileFilter = (req, file, cb) => {
    // Accept all file types for now, you can add specific filtering here
    cb(null, true);
};
// Configure multer
exports.upload = (0, multer_1.default)({
    storage: storage,
    limits: {
        fileSize: 100 * 1024 * 1024, // 100MB limit
    },
    fileFilter: fileFilter,
});
// Middleware for single file upload
exports.uploadSingle = exports.upload.single("file");
//# sourceMappingURL=uploadMiddleware.js.map