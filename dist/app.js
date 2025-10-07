"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const user_routes_1 = require("./app/modules/users/user.routes");
const swagger_1 = require("./app/config/swagger");
const dotenv_1 = __importDefault(require("dotenv"));
const product_routes_1 = require("./app/modules/products/product.routes");
const cms_routes_1 = require("./app/modules/cms/cms.routes");
dotenv_1.default.config();
const app = (0, express_1.default)();
app.use(express_1.default.json());
(0, swagger_1.setupSwagger)(app);
app.use("/api/v1/users", user_routes_1.UserRoutes);
app.use("/api/v1/products", product_routes_1.ProductRoutes);
app.use("/api/v1/cms", cms_routes_1.CMSRoutes);
app.get("/", (req, res) => {
    res.status(200).json("Welcome to multivendor medicine app");
});
exports.default = app;
