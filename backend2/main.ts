import express from "express";
import cors from "cors";
import "dotenv/config";

//my made imports
import { testConnection } from "./config/connectDB";
import pinataRouter from "./routes/pinataRoutes";
import datasetRouter from "./routes/datasetRoutes";

const app = express();

// CORS configuration - must be before other middleware
const allowedOrigins = [
  "http://localhost:3000",

  "http://localhost:5173",
  "http://localhost:5000",
  "https://synapse-dusky.vercel.app/",
];

app.use(
  cors({
    origin: function (origin, callback) {
      // Allow requests with no origin (mobile apps, curl, etc.)
      if (!origin) return callback(null, true);

      if (allowedOrigins.indexOf(origin) !== -1) {
        callback(null, true);
      } else {
        callback(new Error("Not allowed by CORS"));
      }
    },
    credentials: true,
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS", "PATCH"],
    allowedHeaders: ["Content-Type", "Authorization", "X-Requested-With"],
    exposedHeaders: ["Content-Range", "X-Content-Range"],
    maxAge: 86400, // 24 hours
  }),
);

app.use(express.json({ limit: "50mb" }));
app.use(express.urlencoded({ extended: true, limit: "50mb" }));

// Debug middleware to log requests
app.use((req, res, next) => {
  console.log(
    `${new Date().toISOString()} - ${req.method} ${req.path} - Origin: ${
      req.get("Origin") || "No Origin"
    }`,
  );
  next();
});

// Routes
app.use("/api/pinata", pinataRouter);
app.use("/api", datasetRouter);

// Health check route
app.get("/health", (req, res) => {
  res.status(200).json({ status: "OK", message: "Server is running" });
});

const PORT = process.env.PORT || 3000;

app.listen(PORT, async () => {
  console.log(`Server running on port ${PORT}`);

  // Test database connection
  const isConnected = await testConnection();
  if (!isConnected) {
    console.error("Failed to connect to database. Exiting...");
    process.exit(1);
  }
});
