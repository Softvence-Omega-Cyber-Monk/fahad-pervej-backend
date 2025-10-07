"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.UserModel = void 0;
const mongoose_1 = require("mongoose");
const bcryptjs_1 = __importDefault(require("bcryptjs"));
const user_interface_1 = require("./user.interface");
const userSchema = new mongoose_1.Schema({
    name: { type: String, required: true, trim: true },
    email: { type: String, required: true, unique: true, lowercase: true },
    password: { type: String, required: true, minlength: 6 },
    role: {
        type: String,
        enum: ["ADMIN", "VENDOR", "CUSTOMER"],
        default: "CUSTOMER",
    },
    isActive: { type: Boolean, default: true },
    deactivationReason: { type: String },
    isVerified: { type: Boolean },
    businessName: { type: String },
    businessCRNumber: { type: String },
    CRDocuments: { type: String },
    businessType: { type: String },
    businessDescription: { type: String },
    country: { type: String },
    productCategory: {
        type: [String],
        enum: Object.values(user_interface_1.ProductCategory),
    },
    shippingLocation: {
        type: [Object],
    },
    storeDescription: { type: String },
    paymentMethod: {
        type: String,
        enum: Object.values(user_interface_1.PaymentMethod)
    },
    bankAccountHolderName: { type: String },
    bankAccountNumber: { type: String },
    bankRoughingNumber: { type: String },
    taxId: { type: String },
    isPrivacyPolicyAccepted: { type: Boolean },
    vendorSignature: { type: String },
    vendorContract: { type: String },
    isSellerPolicyAccepted: { type: Boolean },
    address: { type: String },
    phone: { type: String },
}, {
    timestamps: true,
});
// Hash password before save
userSchema.pre("save", async function (next) {
    if (!this.isModified("password"))
        return next();
    const salt = await bcryptjs_1.default.genSalt(10);
    this.password = await bcryptjs_1.default.hash(this.password, salt);
    next();
});
userSchema.methods.comparePassword = async function (candidatePassword) {
    return bcryptjs_1.default.compare(candidatePassword, this.password);
};
exports.UserModel = (0, mongoose_1.model)("User", userSchema);
