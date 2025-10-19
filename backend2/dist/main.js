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
const app = (0, express_1.default)();
app.use(express_1.default.json());
const allowedOrigins = ["http://localhost:5173"];
app.use((0, cors_1.default)({
    origin: allowedOrigins,
}));
(0, connectDB_1.connectDB)();
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log("Server started on PORT: ", PORT);
});
