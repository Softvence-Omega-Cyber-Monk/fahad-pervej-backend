"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.userController = exports.UserController = void 0;
const user_service_1 = require("./user.service");
class UserController {
    async registerCustomer(req, res) {
        try {
            const { user, token } = await user_service_1.userService.registerCustomer(req.body);
            res.status(201).json({ success: true, message: "Customer registered successfully", data: { user, token } });
        }
        catch (error) {
            res.status(400).json({ success: false, message: error.message });
        }
    }
    async registerVendor(req, res) {
        try {
            const { user, token } = await user_service_1.userService.registerVendor(req.body);
            res.status(201).json({
                success: true,
                message: "Vendor registered successfully. Please wait for admin verification.",
                data: { user, token },
            });
        }
        catch (error) {
            res.status(400).json({ success: false, message: error.message });
        }
    }
    async login(req, res) {
        try {
            const { email, password } = req.body;
            const { user, token } = await user_service_1.userService.login(email, password);
            res.json({ success: true, message: "Login successful", data: { user, token } });
        }
        catch (error) {
            res.status(401).json({ success: false, message: error.message });
        }
    }
    async verifyVendor(req, res) {
        try {
            const vendorId = req.params.id;
            const vendor = await user_service_1.userService.verifyVendor(vendorId);
            res.json({ success: true, message: "Vendor verified successfully", data: vendor });
        }
        catch (error) {
            res.status(400).json({ success: false, message: error.message });
        }
    }
    async getAllVendors(req, res) {
        try {
            const vendors = await user_service_1.userService.getAllVendors();
            res.json({ success: true, data: vendors });
        }
        catch (error) {
            res.status(500).json({ success: false, message: error.message });
        }
    }
    async getAllCustomers(req, res) {
        try {
            const customers = await user_service_1.userService.getAllCustomers();
            res.json({ success: true, data: customers });
        }
        catch (error) {
            res.status(500).json({ success: false, message: error.message });
        }
    }
    async getProfile(req, res) {
        try {
            const userId = req.user._id || req.user.id;
            const user = await user_service_1.userService.getUserById(userId);
            res.json({ success: true, data: user });
        }
        catch (error) {
            res.status(500).json({ success: false, message: error.message });
        }
    }
    async updateUser(req, res) {
        try {
            const userId = req.user._id;
            const updatedUser = await user_service_1.userService.updateUser(userId, req.body);
            res.json({ success: true, message: "Profile updated successfully", data: updatedUser });
        }
        catch (error) {
            res.status(400).json({ success: false, message: error.message });
        }
    }
    async deactivateUser(req, res) {
        try {
            const userId = req.params.id;
            const { reason } = req.body;
            const user = await user_service_1.userService.deactivateUser(userId, reason);
            res.json({ success: true, message: "User deactivated successfully", data: user });
        }
        catch (error) {
            res.status(400).json({ success: false, message: error.message });
        }
    }
    async deleteUser(req, res) {
        try {
            const userId = req.params.id;
            await user_service_1.userService.deleteUser(userId);
            res.json({ success: true, message: "User deleted successfully" });
        }
        catch (error) {
            res.status(400).json({ success: false, message: error.message });
        }
    }
}
exports.UserController = UserController;
exports.userController = new UserController();
