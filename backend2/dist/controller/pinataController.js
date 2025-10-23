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
        console.log("Upload result:", result);
        res.status(200).json({
            success: true,
            message: "File uploaded successfully",
            data: result,
            // Also return CID at root level for compatibility
            cid: result.ipfsHash,
            ipfsHash: result.ipfsHash,
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
        const fileUrl = `${process.env.PINATA_GATEWAY}/ipfs/${cid}`;
        res.status(200).json({
            success: true,
            message: "File fetched successfully",
            data: result,
            link: fileUrl, // Add the link field that the frontend expects
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