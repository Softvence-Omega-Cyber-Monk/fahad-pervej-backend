import { Router } from "express";
import { productController } from "./product.controller";
import { verifyToken } from "../../middlewares/auth";
import { authorizeRoles } from "../../middlewares/roleAuth";
import { multerUpload } from "../../middlewares/multerUpload";

const router = Router();

/**
 * @swagger
 * tags:
 *   name: Products
 *   description: Product management APIs (Admin & Vendor)
 */

/* ===========================
   📦 POST ROUTES
=========================== */

router.post(
  "/",
  verifyToken,
  authorizeRoles("ADMIN", "VENDOR"),
  multerUpload.fields([
    { name: "mainImage", maxCount: 1 },
    { name: "sideImage", maxCount: 1 },
    { name: "sideImage2", maxCount: 1 },
    { name: "lastImage", maxCount: 1 },
    { name: "video", maxCount: 1 },
  ]),
  productController.createProduct
);

router.post(
  "/bulk",
  verifyToken,
  authorizeRoles("ADMIN", "VENDOR"),
  productController.createBulkProducts
);

/* ===========================
   🔍 GET ROUTES
=========================== */

/**
 * @swagger
 * /products/marked/{type}:
 *   get:
 *     summary: Get products by marking type (special, trending, bestseller, mditems)
 *     tags: [Products]
 *     parameters:
 *       - in: path
 *         name: type
 *         required: true
 *         schema:
 *           type: string
 *           enum: [special, trending, bestseller, mditems]
 *     responses:
 *       200:
 *         description: List of marked products
 */
router.get("/marked/:type", productController.getProductsByMark);

router.get(
  "/admin",
  verifyToken,
  authorizeRoles("ADMIN", "VENDOR"),
  productController.getAllProductsWithSellerName
);

router.get(
  "/admin/:id",
  verifyToken,
  authorizeRoles("ADMIN", "VENDOR"),
  productController.getProductWithSellerName
);

router.get("/", productController.getAllProducts);

router.get(
  "/my/products",
  verifyToken,
  authorizeRoles("ADMIN", "VENDOR"),
  productController.getProductsByUser
);

router.get("/:id", productController.getProductById);

/* ===========================
   ✏️ PATCH ROUTES
=========================== */

/**
 * @swagger
 * /products/{id}/mark:
 *   patch:
 *     summary: Mark/unmark product features (Admin only)
 *     tags: [Products]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               isSpecial:
 *                 type: boolean
 *               isTrending:
 *                 type: boolean
 *               isBestSeller:
 *                 type: boolean
 *               isMDItemsLive:
 *                 type: boolean
 *     responses:
 *       200:
 *         description: Product marking updated successfully
 */
router.patch(
  "/:id/mark",
  verifyToken,
  authorizeRoles("ADMIN"),
  productController.markProduct
);

router.patch(
  "/:id",
  verifyToken,
  authorizeRoles("ADMIN", "VENDOR"),
  multerUpload.fields([
    { name: "mainImage", maxCount: 1 },
    { name: "sideImage", maxCount: 1 },
    { name: "sideImage2", maxCount: 1 },
    { name: "lastImage", maxCount: 1 },
    { name: "video", maxCount: 1 },
  ]),
  productController.updateProduct
);

/* ===========================
   ❌ DELETE ROUTES
=========================== */

router.delete(
  "/:id",
  verifyToken,
  authorizeRoles("ADMIN", "VENDOR"),
  productController.deleteProduct
);

export const ProductRoutes = router;