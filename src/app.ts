// app.ts
import express, { type Request, type Response } from "express";
import dotenv from "dotenv";
import cookieParser from "cookie-parser";
import cors from "cors";

import { setupSwagger } from "./app/config/swagger";
import { UserRoutes } from "./app/modules/users/user.routes";
import { ProductRoutes } from "./app/modules/products/product.routes";
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
import { WalletRoutes } from "./app/modules/wallet/wallet.routes";
import { PolicyRoutes } from "./app/modules/policy/policy.routes";
import { PartnerRoutes } from "./app/modules/partners/partners.routes";
import { shippingRoutes } from "./app/modules/shipping/shipping.routes";
import { PayoutRoutes } from "./app/modules/payout/payout.routes";
import { CMSRouter } from "./app/modules/cms/cms.routes";
import { normalizeParams } from "./app/middlewares/normalizeParams.middleware";
import { LandingRouter } from "./app/modules/landing/landing.route";

dotenv.config();

const app = express();

const allowedOrigins = [
  "http://localhost:5173",
  "http://localhost:5174",
  "https://fahadpervez-client.vercel.app"
];

const corsOptions = {
  origin: function (origin: string | undefined, callback: (err: Error | null, allow?: boolean) => void) {
    if (!origin) return callback(null, true);

    if (allowedOrigins.indexOf(origin) !== -1) {
      callback(null, true);
    } else {
      console.warn(`⚠️ CORS blocked origin: ${origin}`);
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
  exposedHeaders: ['Set-Cookie'],
  optionsSuccessStatus: 204,
  preflightContinue: false, 
  maxAge: 86400 
};
app.use(cors(corsOptions));

app.use(cookieParser());
app.use(express.json({ limit: '50mb' })); // Increase limit for large requests
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// ✅ Increase timeout for file upload routes
app.use('/api/v1/users/register/vendor', (req, res, next) => {
  req.setTimeout(5 * 60 * 1000); // 5 minutes for vendor registration
  res.setTimeout(5 * 60 * 1000);
  next();
});

app.use(normalizeParams);

// ✅ Swagger setup
setupSwagger(app);

// ✅ Routes
app.use("/api/v1/users", UserRoutes);
app.use("/api/v1/products", ProductRoutes);
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
app.use("/api/v1/wallet", WalletRoutes);
app.use("/api/v1/policy", PolicyRoutes)
app.use("/api/v1/partners", PartnerRoutes)
app.use("/api/v1/shipping", shippingRoutes)
app.use("/api/v1/payouts", PayoutRoutes)
app.use("/api/v1/cms", CMSRouter)
app.use("/", LandingRouter);

app.get("/health", (_req: Request, res: Response) => {
  res.status(200).json({
    status: "ok",
    uptime: process.uptime(),
    timestamp: Date.now(),
  });
});

// ✅ Default route
app.get("/", (req: Request, res: Response) => {
  res.status(200).json("Welcome to multivendor medicine app");
});

// ✅ Global error handler for CORS errors
app.use((err: any, req: Request, res: Response, next: any) => {
  if (err.message === 'Not allowed by CORS') {
    return res.status(403).json({
      success: false,
      message: 'CORS policy: Access denied from this origin'
    });
  }
  next(err);
});

export default app;