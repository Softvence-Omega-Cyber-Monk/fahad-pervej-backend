// app.ts
import express, { type Request, type Response } from "express";
import dotenv from "dotenv";
import cookieParser from "cookie-parser";
import cors from "cors";

import { setupSwagger } from "./app/config/swagger";
import { UserRoutes } from "./app/modules/users/user.routes";
import { ProductRoutes } from "./app/modules/products/product.routes";
import { CMSRoutes } from "./app/modules/cms/cms.routes";
import { WishlistRoutes } from "./app/modules/wishlist/wishlist.routes";
import { CategoryRoute } from "./app/modules/category/category.route";
import { ReviewRoutes } from "./app/modules/review/review.routes";
import { SupportRoute } from "./app/modules/support/support.routes";
import { NewsletterRoute } from "./app/modules/newsletter/newsletter.routes";
import { CouponRoute } from "./app/modules/coupon/coupon.routes";
import { OrderRoute } from "./app/modules/order/order.routes";
import { PaymentsRoutes } from "./app/modules/payments/payments.routes";
import { ShipmentRouter } from "./app/modules/shipment/shipment.router";
import { AFSPayment } from "./app/modules/afsPayment/afsPayment.routes";

dotenv.config();

// ✅ Create Express app
const app = express();

// ✅ Middleware
app.use(cookieParser());
app.use(express.json());
app.use(
  cors({
    origin: [
      "http://localhost:5173",
      "http://localhost:5174",
      "https://mditems.com",
      "https://fahadpervez-client.vercel.app",
    ],
    credentials: true,
  })
);
app.use(express.urlencoded({ extended: true }));

// ✅ Swagger setup
setupSwagger(app);

// ✅ Routes
app.use("/api/v1/users", UserRoutes);
app.use("/api/v1/products", ProductRoutes);
app.use("/api/v1/cms", CMSRoutes);
app.use("/api/v1/wishlist", WishlistRoutes);
app.use("/api/v1/category", CategoryRoute);
app.use("/api/v1/reviews", ReviewRoutes);
app.use("/api/v1/support", SupportRoute);
app.use("/api/v1/newsletter", NewsletterRoute);
app.use("/api/v1/coupons", CouponRoute);
app.use("/api/v1/orders", OrderRoute);
app.use("/api/v1/payment", PaymentsRoutes)
app.use("/api/v1/shipment", ShipmentRouter)
app.use('/api/v1/afspay', AFSPayment)
// ✅ Default route
app.get("/", (req: Request, res: Response) => {
  res.status(200).json("Welcome to multivendor medicine app");
});

export default app;
