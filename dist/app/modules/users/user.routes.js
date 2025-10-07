"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.UserRoutes = void 0;
const express_1 = require("express");
const user_controller_1 = require("./user.controller");
const auth_1 = require("../../middlewares/auth");
const roleAuth_1 = require("../../middlewares/roleAuth");
const router = (0, express_1.Router)();
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
router.post("/register/customer", user_controller_1.userController.registerCustomer);
/**
 * @swagger
 * /users/register/vendor:
 *   post:
 *     summary: Register a new vendor
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
 *               - businessName
 *               - businessCRNumber
 *               - CRDocuments
 *               - isPrivacyPolicyAccepted
 *               - vendorSignature
 *               - vendorContract
 *               - isSellerPolicyAccepted
 *             properties:
 *               name: { type: string, example: Jane Vendor }
 *               email: { type: string, example: vendor@example.com }
 *               password: { type: string, example: secret123 }
 *               businessName: { type: string, example: Jane's Store }
 *               businessCRNumber: { type: string, example: CR123456 }
 *               CRDocuments: { type: string, example: "/uploads/cr.pdf" }
 *               businessType: { type: string, example: Retail }
 *               businessDescription: { type: string, example: "Medical supplies" }
 *               country: { type: string, example: USA }
 *               productCategory: { type: array, items: { type: string }, example: ["Analgesics"] }
 *               shippingLocation: { type: array, items: { type: string }, example: ["Local within city state"] }
 *               storeDescription: { type: string, example: "Best meds online" }
 *               paymentMethod: { type: string, example: BANK_ACCOUNT }
 *               bankAccountHolderName: { type: string, example: Jane Vendor }
 *               bankAccountNumber: { type: string, example: 12345678 }
 *               bankRoughingNumber: { type: string, example: 123456789 }
 *               taxId: { type: string, example: TAX12345 }
 *               isPrivacyPolicyAccepted: { type: boolean, example: true }
 *               vendorSignature: { type: string, example: "Jane Vendor" }
 *               vendorContract: { type: string, example: "/uploads/vendor_contract.pdf" }
 *               isSellerPolicyAccepted: { type: boolean, example: true }
 *               address: { type: string, example: "123 Street, City" }
 *               phone: { type: string, example: "+1234567890" }
 *     responses:
 *       201:
 *         description: Vendor registered successfully. Pending verification
 */
router.post("/register/vendor", user_controller_1.userController.registerVendor);
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
 *               email: { type: string, example: user@example.com }
 *               password: { type: string, example: secret123 }
 *     responses:
 *       200:
 *         description: Login successful
 *       401:
 *         description: Unauthorized
 */
router.post("/login", user_controller_1.userController.login);
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
router.get("/profile", auth_1.verifyToken, user_controller_1.userController.getProfile);
/**
 * @swagger
 * /users/profile:
 *   patch:
 *     summary: Update logged-in user profile
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name: { type: string, example: John Updated }
 *               address: { type: string, example: "New Street, City" }
 *               phone: { type: string, example: "+1234567890" }
 *               businessDescription: { type: string, example: "Updated description" }
 *     responses:
 *       200:
 *         description: Profile updated successfully
 */
router.patch("/profile", auth_1.verifyToken, user_controller_1.userController.updateUser);
/**
 * @swagger
 * /users/deactivate/{id}:
 *   patch:
 *     summary: Deactivate a user with optional reason
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: User ID
 *     requestBody:
 *       required: false
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               reason: { type: string, example: "Requested by admin" }
 *     responses:
 *       200:
 *         description: User deactivated successfully
 */
router.patch("/deactivate/:id", auth_1.verifyToken, (0, roleAuth_1.authorizeRoles)("ADMIN", "VENDOR", "CUSTOMER"), user_controller_1.userController.deactivateUser);
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
router.get("/vendors", auth_1.verifyToken, (0, roleAuth_1.authorizeRoles)("ADMIN"), user_controller_1.userController.getAllVendors);
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
router.get("/customers", auth_1.verifyToken, (0, roleAuth_1.authorizeRoles)("ADMIN"), user_controller_1.userController.getAllCustomers);
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
 *         description: Vendor ID
 *     responses:
 *       200:
 *         description: Vendor verified successfully
 */
router.patch("/vendor/verify/:id", auth_1.verifyToken, (0, roleAuth_1.authorizeRoles)("ADMIN"), user_controller_1.userController.verifyVendor);
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
 *         description: User ID
 *     responses:
 *       200:
 *         description: User deleted successfully
 */
router.delete("/:id", auth_1.verifyToken, (0, roleAuth_1.authorizeRoles)("ADMIN"), user_controller_1.userController.deleteUser);
exports.UserRoutes = router;
