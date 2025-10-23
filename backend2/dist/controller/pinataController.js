"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.pinataFetch = exports.pinataUpload = void 0;
const pinataService_1 = require("../service/pinataService");
const pinataUpload = async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({
                success: false,
                message: "No file uploaded",
            });
        }
        const result = await (0, pinataService_1.upload)(req.file);
        res.status(200).json({
            success: true,
            message: "File uploaded successfully",
            data: result,
        });
    }
    catch (error) {
        console.error("Upload error:", error);
        res.status(500).json({
            success: false,
            message: "Error uploading file",
            error: error.message,
        });
    }
};
exports.pinataUpload = pinataUpload;
const pinataFetch = async (req, res) => {
    try {
        const { cid } = req.params;
        if (!cid) {
            return res.status(400).json({
                success: false,
                message: "CID is required",
            });
        }
        const result = await (0, pinataService_1.fetchFile)(cid);
        res.status(200).json({
            success: true,
            message: "File fetched successfully",
            data: result,
        });
    }
    catch (error) {
        console.error("Fetch error:", error);
        res.status(500).json({
            success: false,
            message: "Error fetching file",
            error: error.message,
        });
    }
};
exports.pinataFetch = pinataFetch;
//# sourceMappingURL=pinataController.js.map