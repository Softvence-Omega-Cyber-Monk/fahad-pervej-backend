import express, { type Request, type Response } from "express";
import { UserRoutes } from "./app/modules/users/user.routes";
import { setupSwagger } from "./app/config/swagger";
import dotenv from "dotenv";
import { ProductRoutes } from "./app/modules/products/product.routes";
import { CMSRoutes } from "./app/modules/cms/cms.routes";

dotenv.config();
const app = express()
app.use(express.json())

setupSwagger(app);
app.use("/api/v1/users", UserRoutes);
app.use("/api/v1/products", ProductRoutes);
app.use("/api/v1/cms", CMSRoutes);

app.get("/", (req: Request, res: Response) => {
    res.status(200).json("Welcome to multivendor medicine app");
})


export default app;