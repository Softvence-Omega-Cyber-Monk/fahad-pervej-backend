"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.productController = void 0;
const product_service_1 = require("./product.service");
class ProductController {
    async createProduct(req, res) {
        try {
            const userId = req.user.id;
            const files = req.files;
            // Extract image URLs from uploaded files if present
            const imageUrls = {};
            if (files?.mainImage && files.mainImage[0]) {
                imageUrls.mainImageUrl = files.mainImage[0].path;
            }
            if (files?.sideImage && files.sideImage[0]) {
                imageUrls.sideImageUrl = files.sideImage[0].path;
            }
            if (files?.sideImage2 && files.sideImage2[0]) {
                imageUrls.sideImage2Url = files.sideImage2[0].path;
            }
            if (files?.lastImage && files.lastImage[0]) {
                imageUrls.lastImageUrl = files.lastImage[0].path;
            }
            if (files?.video && files.video[0]) {
                imageUrls.videoUrl = files.video[0].path;
            }
            // Merge form data with image URLs
            const productData = {
                ...req.body,
                ...imageUrls,
                userId
            };
            const product = await product_service_1.productService.createProduct(productData);
            res.status(201).json({
                success: true,
                message: "Product created successfully",
                data: product
            });
        }
        catch (err) {
            res.status(400).json({ success: false, message: err.message });
        }
    }
    async createBulkProducts(req, res) {
        try {
            const userId = req.user._id;
            const products = req.body.map((p) => ({ ...p, userId }));
            const inserted = await product_service_1.productService.createBulkProducts(products);
            res.status(201).json({ success: true, data: inserted });
        }
        catch (err) {
            res.status(400).json({ success: false, message: err.message });
        }
    }
    async getAllProducts(req, res) {
        try {
            const products = await product_service_1.productService.getAllProducts();
            res.json({ success: true, data: products });
        }
        catch (err) {
            res.status(500).json({ success: false, message: err.message });
        }
    }
    async getProductById(req, res) {
        try {
            const product = await product_service_1.productService.getProductById(req.params.id);
            if (!product)
                return res.status(404).json({ success: false, message: "Product not found" });
            res.json({ success: true, data: product });
        }
        catch (err) {
            res.status(500).json({ success: false, message: err.message });
        }
    }
    async updateProduct(req, res) {
        try {
            const { id } = req.params;
            const files = req.files;
            // Extract image URLs from uploaded files if present
            const imageUrls = {};
            if (files?.mainImage && files.mainImage[0]) {
                imageUrls.mainImageUrl = files.mainImage[0].path;
            }
            if (files?.sideImage && files.sideImage[0]) {
                imageUrls.sideImageUrl = files.sideImage[0].path;
            }
            if (files?.sideImage2 && files.sideImage2[0]) {
                imageUrls.sideImage2Url = files.sideImage2[0].path;
            }
            if (files?.lastImage && files.lastImage[0]) {
                imageUrls.lastImageUrl = files.lastImage[0].path;
            }
            if (files?.video && files.video[0]) {
                imageUrls.videoUrl = files.video[0].path;
            }
            // Merge form data with image URLs
            const updateData = {
                ...req.body,
                ...imageUrls
            };
            const updated = await product_service_1.productService.updateProduct(id, updateData);
            if (!updated)
                return res.status(404).json({ success: false, message: "Product not found" });
            res.json({
                success: true,
                message: "Product updated successfully",
                data: updated
            });
        }
        catch (err) {
            res.status(400).json({ success: false, message: err.message });
        }
    }
    async deleteProduct(req, res) {
        try {
            await product_service_1.productService.deleteProduct(req.params.id);
            res.json({ success: true, message: "Product deleted successfully" });
        }
        catch (err) {
            res.status(400).json({ success: false, message: err.message });
        }
    }
    async getProductsByUser(req, res) {
        try {
            const userId = req.user.id;
            const products = await product_service_1.productService.getProductsByUser(userId);
            res.json({ success: true, data: products });
        }
        catch (err) {
            res.status(500).json({ success: false, message: err.message });
        }
    }
    async getProductWithSellerName(req, res) {
        try {
            const { id } = req.params;
            const product = await product_service_1.productService.getProductWithSellerName(id);
            res.json({
                success: true,
                message: "Product with seller details fetched successfully",
                data: product,
            });
        }
        catch (err) {
            res.status(400).json({ success: false, message: err.message });
        }
    }
    async getAllProductsWithSellerName(req, res) {
        try {
            const products = await product_service_1.productService.getAllProductsWithSellerName();
            res.json({
                success: true,
                message: "All products with seller details fetched successfully",
                data: products,
            });
        }
        catch (err) {
            res.status(400).json({ success: false, message: err.message });
        }
    }
}
exports.productController = new ProductController();
