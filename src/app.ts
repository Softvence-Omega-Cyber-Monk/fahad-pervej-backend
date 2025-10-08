import express, { type Request, type Response } from "express";
import dotenv from "dotenv";
dotenv.config();
const app = express()


import { UserRoutes } from "./app/modules/users/user.routes";
import { setupSwagger } from "./app/config/swagger";

import { ProductRoutes } from "./app/modules/products/product.routes";
import { CMSRoutes } from "./app/modules/cms/cms.routes";
import cors from "cors"


app.use(express.json())
app.use(cors())

setupSwagger(app);
app.use("/api/v1/users", UserRoutes);
app.use("/api/v1/products", ProductRoutes);
app.use("/api/v1/cms", CMSRoutes);

app.get("/", (req: Request, res: Response) => {
    res.status(200).json("Welcome to multivendor medicine app");
})


export default app;