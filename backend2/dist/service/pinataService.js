"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.upload = upload;
exports.fetchFile = fetchFile;
const pinata_1 = require("pinata");
const pinata = new pinata_1.PinataSDK({
    pinataJwt: process.env.PINATA_JWT_SECRET_ACCESS,
    pinataGateway: process.env.PINATA_GATEWAY_URI,
});
async function upload(file) {
    console.log("The file that has come to our warehouse is: ", file);
    try {
        // Convert buffer to File object
        const blob = new Blob([file.buffer], { type: file.mimetype });
        const fileToUpload = new File([blob], file.originalname, {
            type: file.mimetype,
        });
        console.log("Uploading to pinata..");
        const result = await pinata.upload.public.file(fileToUpload, {
            metadata: {
                name: file.originalname || "dataset",
            },
        });
        console.log("File uploaded to pinata: ", result);
        return {
            success: true,
            ipfsHash: result.cid,
            pinataUrl: `${process.env.PINATA_GATEWAY}/ipfs/${result.cid}`,
            fileSize: file.size,
            timestamp: new Date().toISOString(),
        };
    }
    catch (error) {
        console.error("Error uploading file to IPFS:", error);
        throw {
            success: false,
            error: error.message,
        };
    }
}
async function fetchFile(cid) {
    try {
        const url = `${process.env.PINATA_GATEWAY}/ipfs/${cid}`;
        const response = await fetch(url);
        const data = await response.json();
        return {
            success: true,
            data: data,
        };
    }
    catch (error) {
        console.error("Error fetching file from IPFS:", error);
        throw {
            success: false,
            error: error.message,
        };
    }
}
//# sourceMappingURL=pinataService.js.map