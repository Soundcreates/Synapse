import { PinataSDK } from "pinata";

// Define the file interface for multer files
interface MulterFile {
  fieldname: string;
  originalname: string;
  encoding: string;
  mimetype: string;
  buffer: Buffer;
  size: number;
}

const pinata = new PinataSDK({
  pinataJwt: process.env.PINATA_JWT_SECRET_ACCESS,
  pinataGateway: process.env.PINATA_GATEWAY_URI,
});

export async function upload(file: MulterFile) {
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
  } catch (error: any) {
    console.error("Error uploading file to IPFS:", error);
    throw {
      success: false,
      error: error.message,
    };
  }
}

export async function fetchFile(cid: string) {
  try {
    const url = `${process.env.PINATA_GATEWAY}/ipfs/${cid}`;
    const response = await fetch(url);
    const data = await response.json();
    return {
      success: true,
      data: data,
    };
  } catch (error: any) {
    console.error("Error fetching file from IPFS:", error);
    throw {
      success: false,
      error: error.message,
    };
  }
}
