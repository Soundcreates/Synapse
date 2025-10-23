"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
require("dotenv/config");
//my made imports
const connectDB_1 = require("./config/connectDB");
const pinataRoutes_1 = __importDefault(require("./routes/pinataRoutes"));
const datasetRoutes_1 = __importDefault(require("./routes/datasetRoutes"));
const app = (0, express_1.default)();
// CORS configuration - must be before other middleware
const allowedOrigins = [
    "http://localhost:3000",
    "http://localhost:3001",
    "http://localhost:5173",
    "http://localhost:5000",
];
app.use((0, cors_1.default)({
    origin: function (origin, callback) {
        // Allow requests with no origin (mobile apps, curl, etc.)
        if (!origin)
            return callback(null, true);
        if (allowedOrigins.indexOf(origin) !== -1) {
            callback(null, true);
        }
        else {
            callback(new Error("Not allowed by CORS"));
        }
    },
    credentials: true,
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization", "X-Requested-With"],
    exposedHeaders: ["Content-Range", "X-Content-Range"],
    maxAge: 86400, // 24 hours
}));
app.use(express_1.default.json({ limit: "50mb" }));
app.use(express_1.default.urlencoded({ extended: true, limit: "50mb" }));
// Debug middleware to log requests
app.use((req, res, next) => {
    console.log(`${new Date().toISOString()} - ${req.method} ${req.path} - Origin: ${req.get("Origin") || "No Origin"}`);
    next();
});
// Routes
app.use("/api/pinata", pinataRoutes_1.default);
app.use("/api", datasetRoutes_1.default);
// Health check route
app.get("/health", (req, res) => {
    res.status(200).json({ status: "OK", message: "Server is running" });
});
const PORT = process.env.PORT || 3000;
app.listen(PORT, async () => {
    console.log(`Server running on port ${PORT}`);
    // Test database connection
    const isConnected = await (0, connectDB_1.testConnection)();
    if (!isConnected) {
        console.error("Failed to connect to database. Exiting...");
        process.exit(1);
    }
});
//# sourceMappingURL=main.js.map