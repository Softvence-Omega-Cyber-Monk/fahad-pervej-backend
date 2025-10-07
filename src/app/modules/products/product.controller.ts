import { Request, Response } from "express";
import { productService } from "./product.service";

class ProductController {
    async createProduct(req: Request, res: Response) {
        try {
            const userId = (req as any).user.id;
            const files = req.files as { [fieldname: string]: Express.Multer.File[] };

            // Extract image URLs from uploaded files if present
            const imageUrls: any = {};
            
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

            const product = await productService.createProduct(productData);
            
            res.status(201).json({
                success: true,
                message: "Product created successfully",
                data: product
            });
        }
        catch (err: any) {
            res.status(400).json({ success: false, message: err.message })
        }
    }

    async createBulkProducts(req: Request, res: Response) {
        try {
            const userId = (req as any).user._id;
            const products = req.body.map((p: any) => ({ ...p, userId }));
            const inserted = await productService.createBulkProducts(products);
            res.status(201).json({ success: true, data: inserted });
        } catch (err: any) {
            res.status(400).json({ success: false, message: err.message });
        }
    }

    async getAllProducts(req: Request, res: Response) {
        try {
            const products = await productService.getAllProducts();
            res.json({ success: true, data: products });
        } catch (err: any) {
            res.status(500).json({ success: false, message: err.message });
        }
    }

    async getProductById(req: Request, res: Response) {
        try {
            const product = await productService.getProductById(req.params.id);
            if (!product) return res.status(404).json({ success: false, message: "Product not found" });
            res.json({ success: true, data: product });
        } catch (err: any) {
            res.status(500).json({ success: false, message: err.message });
        }
    }

    async updateProduct(req: Request, res: Response) {
        try {
            const { id } = req.params;
            const files = req.files as { [fieldname: string]: Express.Multer.File[] };

            // Extract image URLs from uploaded files if present
            const imageUrls: any = {};
            
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

            const updated = await productService.updateProduct(id, updateData);
            if (!updated) return res.status(404).json({ success: false, message: "Product not found" });
            
            res.json({ 
                success: true, 
                message: "Product updated successfully",
                data: updated 
            });
        } catch (err: any) {
            res.status(400).json({ success: false, message: err.message });
        }
    }

    async deleteProduct(req: Request, res: Response) {
        try {
            await productService.deleteProduct(req.params.id);
            res.json({ success: true, message: "Product deleted successfully" });
        } catch (err: any) {
            res.status(400).json({ success: false, message: err.message });
        }
    }

    async getProductsByUser(req: Request, res: Response) {
        try {
            const userId = (req as any).user.id;
            const products = await productService.getProductsByUser(userId);
            res.json({ success: true, data: products });
        } catch (err: any) {
            res.status(500).json({ success: false, message: err.message });
        }
    }

    async getProductWithSellerName(req: Request, res: Response) {
        try {
            const { id } = req.params;
            const product = await productService.getProductWithSellerName(id);
            res.json({
                success: true,
                message: "Product with seller details fetched successfully",
                data: product,
            });
        } catch (err: any) {
            res.status(400).json({ success: false, message: err.message });
        }
    }

    async getAllProductsWithSellerName(req: Request, res: Response) {
        try {
            const products = await productService.getAllProductsWithSellerName();
            res.json({
                success: true,
                message: "All products with seller details fetched successfully",
                data: products,
            });
        } catch (err: any) {
            res.status(400).json({ success: false, message: err.message });
        }
    }
}

export const productController = new ProductController();