import multer from "multer";

// Configure multer for memory storage
const storage = multer.memoryStorage();

// File filter function
const fileFilter = (req: any, file: any, cb: any) => {
  // Accept all file types for now, you can add specific filtering here
  cb(null, true);
};

// Configure multer
export const upload = multer({
  storage: storage,
  limits: {
    fileSize: 100 * 1024 * 1024, // 100MB limit
  },
  fileFilter: fileFilter,
});

// Middleware for single file upload
export const uploadSingle = upload.single("file");
