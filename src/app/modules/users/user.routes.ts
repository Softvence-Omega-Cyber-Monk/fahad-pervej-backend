import { Router } from "express";
import { userController } from "./user.controller";
import { verifyToken } from "../../middlewares/auth";
import { authorizeRoles } from "../../middlewares/roleAuth";
import { multerUpload } from "../../middlewares/multerUpload";

const router = Router();

/**
 * @swagger
 * tags:
 *   name: Users
 *   description: User management endpoints
 */

/**
 * @swagger
 * /users/register/customer:
 *   post:
 *     summary: Register a new customer
 *     tags: [Users]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - name
 *               - email
 *               - password
 *             properties:
 *               name: { type: string, example: John Doe }
 *               email: { type: string, example: johndoe@example.com }
 *               password: { type: string, example: secret123 }
 *     responses:
 *       201:
 *         description: Customer registered successfully
 */
router.post("/register/customer", userController.registerCustomer);

/**
 * @swagger
 * /users/register/vendor:
 *   post:
 *     summary: Register a new vendor with document uploads
 *     tags: [Users]
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             required:
 *               - name
 *               - email
 *               - password
 *               - businessName
 *               - businessCRNumber
 *               - CRDocuments
 *               - isPrivacyPolicyAccepted
 *               - vendorSignature
 *               - vendorContract
 *               - isSellerPolicyAccepted
 *             properties:
 *               name: { type: string }
 *               email: { type: string }
 *               password: { type: string }
 *               phone: { type: string }
 *               businessName: { type: string }
 *               businessCRNumber: { type: string }
 *               businessType: { type: string }
 *               businessDescription: { type: string }
 *               country: { type: string }
 *               CRDocuments:
 *                 type: string
 *                 format: binary
 *                 description: CR document file (PDF/Image)
 *               productCategory:
 *                 type: array
 *                 items:
 *                   type: string
 *               shippingLocation:
 *                 type: array
 *                 items:
 *                   type: string
 *               storeDescription: { type: string }
 *               paymentMethod: { type: string, enum: [Bank Account, Paypal, Stripe] }
 *               bankAccountHolderName: { type: string }
 *               bankAccountNumber: { type: string }
 *               bankRoughingNumber: { type: string }
 *               taxId: { type: string }
 *               isPrivacyPolicyAccepted: { type: boolean }
 *               vendorSignature:
 *                 type: string
 *                 format: binary
 *                 description: Vendor signature file (PDF/Image)
 *               vendorContract:
 *                 type: string
 *                 format: binary
 *                 description: Signed vendor contract (PDF)
 *               isSellerPolicyAccepted: { type: boolean }
 *     responses:
 *       201:
 *         description: Vendor registered successfully. Pending verification
 */
router.post(
  "/register/vendor",
  multerUpload.fields([
    { name: "CRDocuments", maxCount: 1 },
    { name: "vendorSignature", maxCount: 1 },
    { name: "vendorContract", maxCount: 1 },
  ]),
  userController.registerVendor
);

/**
 * @swagger
 * /users/login:
 *   post:
 *     summary: Login user (customer/vendor/admin)
 *     tags: [Users]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - email
 *               - password
 *             properties:
 *               email: { type: string, example: admin@gmail.com }
 *               password: { type: string, example: secret123 }
 *     responses:
 *       200:
 *         description: Login successful
 *       401:
 *         description: Unauthorized
 */
router.post("/login", userController.login);

/**
 * @swagger
 * /users/refresh-token:
 *   post:
 *     summary: Refresh access token using refresh token
 *     tags: [Users]
 *     requestBody:
 *       required: false
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               refreshToken: { type: string }
 *     responses:
 *       200:
 *         description: Access token refreshed successfully
 *       401:
 *         description: Invalid or expired refresh token
 */
router.post("/refresh-token", userController.refreshToken);

/**
 * @swagger
 * /users/logout:
 *   post:
 *     summary: Logout user and clear cookies
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Logged out successfully
 */
router.post("/logout", verifyToken, userController.logout);

/**
 * @swagger
 * /users/profile:
 *   get:
 *     summary: Get logged-in user profile
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: User profile fetched successfully
 */
router.get("/profile", verifyToken, userController.getProfile);

/**
 * @swagger
 * /users/profile:
 *   patch:
 *     summary: Update logged-in user profile with optional image uploads
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             properties:
 *               name: { type: string }
 *               email: { type: string }
 *               address: { type: string }
 *               phone: { type: string }
 *               profileImage:
 *                 type: string
 *                 format: binary
 *               storeBanner:
 *                 type: string
 *                 format: binary
 *               currency: { type: string }
 *               holdingTime: { type: number }
 *               categories: { type: string, description: "JSON string array" }
 *               language: { type: string }
 *     responses:
 *       200:
 *         description: Profile updated successfully
 */
router.patch(
  "/profile", 
  verifyToken, 
  multerUpload.fields([
    { name: "profileImage", maxCount: 1 },
    { name: "storeBanner", maxCount: 1 }
  ]),
  userController.updateUser
);

/**
 * @swagger
 * /users/change-password:
 *   put:
 *     summary: Change password for logged-in user
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - currentPassword
 *               - newPassword
 *               - confirmPassword
 *             properties:
 *               currentPassword: { type: string }
 *               newPassword: { type: string }
 *               confirmPassword: { type: string }
 *     responses:
 *       200:
 *         description: Password changed successfully
 */
router.put("/change-password", verifyToken, userController.changePassword);

/**
 * @swagger
 * /users/deactivate/{id}:
 *   patch:
 *     summary: Deactivate a user
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               reason: { type: string }
 *     responses:
 *       200:
 *         description: User deactivated successfully
 */
router.patch("/deactivate/:id", verifyToken, authorizeRoles("ADMIN", "VENDOR", "CUSTOMER"), userController.deactivateUser);

/**
 * @swagger
 * /users/vendors/pending:
 *   get:
 *     summary: Get all pending vendors (Admin only)
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of pending vendors
 */
router.get("/vendors/pending", verifyToken, authorizeRoles("ADMIN"), userController.getPendingVendors);

/**
 * @swagger
 * /users/vendors/pending/{id}:
 *   get:
 *     summary: Get a single pending vendor by ID
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Pending vendor details
 */
router.get("/vendors/pending/:id", verifyToken, authorizeRoles("ADMIN"), userController.getPendingVendorById);

/**
 * @swagger
 * /users/vendors:
 *   get:
 *     summary: Get all vendors (Admin only)
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of all vendors
 */
router.get("/vendors", verifyToken, authorizeRoles("ADMIN"), userController.getAllVendors);

/**
 * @swagger
 * /users/customers:
 *   get:
 *     summary: Get all customers (Admin only)
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of all customers
 */
router.get("/customers", verifyToken, authorizeRoles("ADMIN"), userController.getAllCustomers);

/**
 * @swagger
 * /users/vendor/verify/{id}:
 *   patch:
 *     summary: Verify a vendor (Admin only)
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Vendor verified successfully
 */
router.patch("/vendor/verify/:id", verifyToken, authorizeRoles("ADMIN"), userController.verifyVendor);

/**
 * @swagger
 * /users/{id}:
 *   delete:
 *     summary: Delete a user (Admin only)
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: User deleted successfully
 */
router.delete("/:id", verifyToken, authorizeRoles("ADMIN"), userController.deleteUser);

export const UserRoutes = router;