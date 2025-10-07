import { Router } from "express";
import { productController } from "./product.controller";
import { verifyToken } from "../../middlewares/auth";
import { authorizeRoles } from "../../middlewares/roleAuth";
import { multerUpload } from "../../config/multer.config";

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

/**
 * @swagger
 * /products:
 *   post:
 *     summary: Create a new product (with optional image uploads)
 *     tags: [Products]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             required:
 *               - productName
 *               - productCategory
 *               - productSKU
 *               - companyName
 *               - gender
 *               - availableSize
 *               - productDescription
 *               - stock
 *               - currency
 *               - pricePerUnit
 *             properties:
 *               productName:
 *                 type: string
 *                 example: Smart Watch
 *               productCategory:
 *                 type: string
 *                 example: Electronics
 *               productSKU:
 *                 type: string
 *                 example: SW-001
 *               companyName:
 *                 type: string
 *                 example: Apple
 *               gender:
 *                 type: string
 *                 example: Unisex
 *               availableSize:
 *                 type: string
 *                 example: One Size
 *               productDescription:
 *                 type: string
 *                 example: Latest smartwatch with health tracking
 *               stock:
 *                 type: number
 *                 example: 100
 *               currency:
 *                 type: string
 *                 example: USD
 *               pricePerUnit:
 *                 type: number
 *                 example: 399.99
 *               specialPrice:
 *                 type: number
 *                 example: 349.99
 *               specialPriceStartingDate:
 *                 type: string
 *                 format: date
 *               specialPriceEndingDate:
 *                 type: string
 *                 format: date
 *               mainImage:
 *                 type: string
 *                 format: binary
 *                 description: Main product image (overrides mainImageUrl if provided)
 *               sideImage:
 *                 type: string
 *                 format: binary
 *                 description: Side product image (overrides sideImageUrl if provided)
 *               sideImage2:
 *                 type: string
 *                 format: binary
 *                 description: Second side image (overrides sideImage2Url if provided)
 *               lastImage:
 *                 type: string
 *                 format: binary
 *                 description: Last/back image (overrides lastImageUrl if provided)
 *               video:
 *                 type: string
 *                 format: binary
 *                 description: Product video (overrides videoUrl if provided)
 *     responses:
 *       201:
 *         description: Product created successfully
 */
router.post(
  "/",
  verifyToken,
  authorizeRoles("ADMIN", "VENDOR"),
  multerUpload.fields([
    { name: "mainImage", maxCount: 1 },
    { name: "sideImage", maxCount: 1 },
    { name: "sideImage2", maxCount: 1 },
    { name: "lastImage", maxCount: 1 },
    { name: "video", maxCount: 1 }
  ]),
  productController.createProduct
);

/**
 * @swagger
 * /products/bulk:
 *   post:
 *     summary: Create multiple products
 *     tags: [Products]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: array
 *             items:
 *               type: object
 *               properties:
 *                 productName:
 *                   type: string
 *                   example: Bluetooth Speaker
 *                 productCategory:
 *                   type: string
 *                   example: Electronics
 *                 pricePerUnit:
 *                   type: number
 *                   example: 49.99
 *                 stock:
 *                   type: number
 *                   example: 200
 *     responses:
 *       201:
 *         description: Bulk products created successfully
 */
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
 * /products/admin:
 *   get:
 *     summary: Get all products with their seller details
 *     tags: [Products]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of all products with seller info
 */
router.get(
  "/admin",
  verifyToken,
  authorizeRoles("ADMIN", "VENDOR"),
  productController.getAllProductsWithSellerName
);

/**
 * @swagger
 * /products/admin/{id}:
 *   get:
 *     summary: Get a specific product with seller details by ID
 *     tags: [Products]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           example: 652f0caa24d9f62ed3e56b9a
 *     responses:
 *       200:
 *         description: Product details with seller info
 *       404:
 *         description: Product not found
 */
router.get(
  "/admin/:id",
  verifyToken,
  authorizeRoles("ADMIN", "VENDOR"),
  productController.getProductWithSellerName
);

/**
 * @swagger
 * /products:
 *   get:
 *     summary: Get all products (without seller info)
 *     tags: [Products]
 *     responses:
 *       200:
 *         description: List of all products
 */
router.get("/", productController.getAllProducts);

/**
 * @swagger
 * /products/my/products:
 *   get:
 *     summary: Get all products created by the logged-in user
 *     tags: [Products]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of user's own products
 */
router.get(
  "/my/products",
  verifyToken,
  authorizeRoles("ADMIN", "VENDOR"),
  productController.getProductsByUser
);

/**
 * @swagger
 * /products/{id}:
 *   get:
 *     summary: Get a product by ID
 *     tags: [Products]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           example: 652f0caa24d9f62ed3e56b9a
 *     responses:
 *       200:
 *         description: Product found successfully
 *       404:
 *         description: Product not found
 */
router.get("/:id", productController.getProductById);

/* ===========================
   ✏️ PATCH ROUTES
=========================== */

/**
 * @swagger
 * /products/{id}:
 *   patch:
 *     summary: Update a product by ID (with optional image uploads)
 *     tags: [Products]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           example: 652f0caa24d9f62ed3e56b9a
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             properties:
 *               productName:
 *                 type: string
 *                 example: Smart Watch Pro
 *               pricePerUnit:
 *                 type: number
 *                 example: 129.99
 *               stock:
 *                 type: number
 *               mainImage:
 *                 type: string
 *                 format: binary
 *                 description: New main image (overrides mainImageUrl if provided)
 *               sideImage:
 *                 type: string
 *                 format: binary
 *               sideImage2:
 *                 type: string
 *                 format: binary
 *               lastImage:
 *                 type: string
 *                 format: binary
 *               video:
 *                 type: string
 *                 format: binary
 *     responses:
 *       200:
 *         description: Product updated successfully
 */
router.patch(
  "/:id",
  verifyToken,
  authorizeRoles("ADMIN", "VENDOR"),
  multerUpload.fields([
    { name: "mainImage", maxCount: 1 },
    { name: "sideImage", maxCount: 1 },
    { name: "sideImage2", maxCount: 1 },
    { name: "lastImage", maxCount: 1 },
    { name: "video", maxCount: 1 }
  ]),
  productController.updateProduct
);

/* ===========================
   ❌ DELETE ROUTES
=========================== */

/**
 * @swagger
 * /products/{id}:
 *   delete:
 *     summary: Delete a product by ID
 *     tags: [Products]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           example: 652f0caa24d9f62ed3e56b9a
 *     responses:
 *       200:
 *         description: Product deleted successfully
 */
router.delete(
  "/:id",
  verifyToken,
  authorizeRoles("ADMIN", "VENDOR"),
  productController.deleteProduct
);

export const ProductRoutes = router;