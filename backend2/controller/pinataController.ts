import { Request, Response } from "express";
import { upload, fetchFile } from "../service/pinataService";

export const pinataUpload = async (req: Request, res: Response) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: "No file uploaded",
      });
    }

    const result = await upload(req.file as any);
    console.log("Upload result:", result);

    res.status(200).json({
      success: true,
      message: "File uploaded successfully",
      data: result,
      // Also return CID at root level for compatibility
      cid: result.ipfsHash,
      ipfsHash: result.ipfsHash,
    });
  } catch (error: any) {
    console.error("Upload error:", error);
    res.status(500).json({
      success: false,
      message: "Error uploading file",
      error: error.message,
    });
  }
};

export const pinataFetch = async (req: Request, res: Response) => {
  try {
    const { cid } = req.params;

    if (!cid) {
      return res.status(400).json({
        success: false,
        message: "CID is required",
      });
    }

    const result = await fetchFile(cid);
    const fileUrl = `${process.env.PINATA_GATEWAY}/ipfs/${cid}`;

    res.status(200).json({
      success: true,
      message: "File fetched successfully",
      data: result,
      link: fileUrl, // Add the link field that the frontend expects
    });
  } catch (error: any) {
    console.error("Fetch error:", error);
    res.status(500).json({
      success: false,
      message: "Error fetching file",
      error: error.message,
    });
  }
};
