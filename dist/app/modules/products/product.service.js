"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.productService = void 0;
const product_model_1 = require("./product.model");
class ProductService {
    async createProduct(data) {
        const product = await product_model_1.ProductModel.create(data);
        return product;
    }
    async createBulkProducts(products) {
        const inserted = await product_model_1.ProductModel.insertMany(products);
        return inserted;
    }
    async getProductById(id) {
        return product_model_1.ProductModel.findById(id).exec();
    }
    async getAllProducts() {
        return product_model_1.ProductModel.find().exec();
    }
    async updateProduct(id, data) {
        return product_model_1.ProductModel.findByIdAndUpdate(id, data, { new: true }).exec();
    }
    async deleteProduct(id) {
        await product_model_1.ProductModel.findByIdAndDelete(id).exec();
    }
    async getProductsByUser(userId) {
        return product_model_1.ProductModel.find({ userId }).exec();
    }
    async getProductWithSellerName(id) {
        const product = await product_model_1.ProductModel.findById(id)
            .populate("userId", "name email")
            .exec();
        if (!product)
            throw new Error("Product not found");
        const formattedProduct = {
            ...product.toObject(),
            seller: {
                name: product.userId?.name,
                email: product.userId?.email,
            },
        };
        return formattedProduct;
    }
    async getAllProductsWithSellerName() {
        const products = await product_model_1.ProductModel.find()
            .populate("userId", "name email role")
            .exec();
        return products.map((product) => ({
            ...product.toObject(),
            seller: {
                name: product.userId?.name,
                email: product.userId?.email,
                role: product.userId?.role,
            },
            userId: undefined,
        }));
    }
}
exports.productService = new ProductService();
