"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const mongoose_1 = __importDefault(require("mongoose"));
const app_1 = __importDefault(require("./app"));
const env_1 = require("./app/config/env");
let server;
const PORT = env_1.enVars.PORT || 5000;
const startServer = async () => {
    try {
        await mongoose_1.default.connect("mongodb+srv://tour_management:11A22b33c44D@cluster0.9o8rsbr.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0");
        console.log("Connected to DB");
        server = app_1.default.listen(PORT, () => {
            console.log("Server is listening to port 5000");
        });
    }
    catch (err) {
        console.log(err);
    }
};
process.on("unhandledRejection", (err) => {
    console.log("Unhandled Rejection Detected, Server is shutting down...", err);
    if (server) {
        server.close(() => {
            process.exit(1);
        });
    }
    process.exit(1);
});
startServer();
