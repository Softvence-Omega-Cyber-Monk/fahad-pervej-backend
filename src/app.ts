import express, { type Request, type Response } from "express";
import dotenv from "dotenv";
import cookieParser from "cookie-parser";
dotenv.config();
const app = express()


import { UserRoutes } from "./app/modules/users/user.routes";
import { setupSwagger } from "./app/config/swagger";

import { ProductRoutes } from "./app/modules/products/product.routes";
import { CMSRoutes } from "./app/modules/cms/cms.routes";
import cors from "cors"
import { WishlistRoutes } from "./app/modules/wishlist/wishlist.routes";
import { CategoryRoute } from "./app/modules/category/category.route";

app.use(cookieParser());
app.use(express.json())
app.use(cors({
    origin: "http://localhost:5173",
    credentials: true
}))
app.use(express.urlencoded({ extended: true }));

setupSwagger(app);
app.use("/api/v1/users", UserRoutes);
app.use("/api/v1/products", ProductRoutes);
app.use("/api/v1/cms", CMSRoutes);
app.use("/api/v1/wishlist", WishlistRoutes)
app.use("/api/v1/category", CategoryRoute)

app.get("/", (req: Request, res: Response) => {
    res.status(200).json("Welcome to multivendor medicine app");
})


export default app;
