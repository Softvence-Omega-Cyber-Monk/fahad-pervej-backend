"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.userService = exports.UserService = void 0;
const user_model_1 = require("./user.model");
class UserService {
    async registerCustomer(payload) {
        payload.role = "CUSTOMER";
        const existingUser = await user_model_1.UserModel.findOne({ email: payload.email });
        if (existingUser)
            throw new Error("Email already exists");
        const user = new user_model_1.UserModel(payload);
        await user.save();
        const token = this.generateToken(user.id.toString(), user.role);
        return { user, token };
    }
    async registerVendor(payload) {
        payload.role = "VENDOR";
        payload.isVerified = false;
        const existingUser = await user_model_1.UserModel.findOne({ email: payload.email });
        if (existingUser)
            throw new Error("Email already exists");
        const user = new user_model_1.UserModel(payload);
        await user.save();
        const token = this.generateToken(user.id.toString(), user.role);
        return { user, token };
    }
    async login(email, password) {
        const user = await user_model_1.UserModel.findOne({ email }).select("+password");
        if (!user)
            throw new Error("Invalid email or password");
        const isMatch = await user.comparePassword(password);
        if (!isMatch)
            throw new Error("Invalid email or password");
        if (user.role === "VENDOR" && !user.isVerified)
            throw new Error("Your vendor profile is pending admin verification");
        const token = this.generateToken(user.id.toString(), user.role);
        user.password = ""; // remove password from response
        return { user, token };
    }
    async verifyVendor(vendorId) {
        const vendor = await user_model_1.UserModel.findById(vendorId);
        if (!vendor)
            throw new Error("Vendor not found");
        vendor.isVerified = true;
        return vendor.save();
    }
    async getAllVendors() {
        return user_model_1.UserModel.find({ role: "VENDOR" });
    }
    async getAllCustomers() {
        return user_model_1.UserModel.find({ role: "CUSTOMER" });
    }
    async getUserById(userId) {
        const user = await user_model_1.UserModel.findById(userId);
        if (!user)
            throw new Error("User not found");
        return user;
    }
    async updateUser(userId, payload) {
        // Prevent role or sensitive changes via this method
        delete payload.role;
        delete payload.isVerified;
        const updatedUser = await user_model_1.UserModel.findByIdAndUpdate(userId, payload, {
            new: true,
            runValidators: true,
        });
        if (!updatedUser)
            throw new Error("User not found");
        return updatedUser;
    }
    async deactivateUser(userId, reason) {
        const user = await user_model_1.UserModel.findById(userId);
        if (!user)
            throw new Error("User not found");
        user.isActive = false;
        if (reason)
            user.deactivationReason = reason;
        return user.save();
    }
    async deleteUser(userId) {
        const user = await user_model_1.UserModel.findById(userId);
        if (!user)
            throw new Error("User not found");
        await user_model_1.UserModel.findByIdAndDelete(userId);
    }
    // ================== HELPER METHOD ==================
    generateToken(id, role) {
        const secret = process.env.JWT_SECRET || "secretkey";
        return require("jsonwebtoken").sign({ id, role }, secret, { expiresIn: "7d" });
    }
}
exports.UserService = UserService;
exports.userService = new UserService();
