import { IBulkProduct, IProduct } from "./product.interface";
import { ProductModel } from "./product.model";

class ProductService {
    async createProduct(data: IProduct): Promise<IProduct> {
        const product = await ProductModel.create(data);
        return product
    }
    async createBulkProducts(products: IBulkProduct): Promise<IProduct[]> {
        const inserted = await ProductModel.insertMany(products);
        return inserted
    }
    async getProductById(id: string): Promise<IProduct | null> {
        return ProductModel.findById(id).exec()
    }
    async getAllProducts(): Promise<IProduct[]> {
        return ProductModel.find().exec()
    }
    async updateProduct(id: string, data: Partial<IProduct>): Promise<IProduct | null> {
        return ProductModel.findByIdAndUpdate(id, data, { new: true }).exec()
    }
    async deleteProduct(id: string): Promise<void> {
        await ProductModel.findByIdAndDelete(id).exec()
    }
    async getProductsByUser(userId: string): Promise<IProduct[]> {
        return ProductModel.find({ userId }).exec();
    }

    async getProductWithSellerName(id: string): Promise<any> {
        const product = await ProductModel.findById(id)
            .populate("userId", "name email")
            .exec();
        if (!product) throw new Error("Product not found");
        const formattedProduct = {
            ...product.toObject(),
            seller: {
                name: (product as any).userId?.name,
                email: (product as any).userId?.email,
            },
        };
        return formattedProduct;
    }
    async getAllProductsWithSellerName(): Promise<any[]> {
        const products = await ProductModel.find()
            .populate("userId", "name email role")
            .exec();
        return products.map((product: any) => ({
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

export const productService = new ProductService();