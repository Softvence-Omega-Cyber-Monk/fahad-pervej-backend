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
        return ProductModel.findById(id).populate("userId", "name email role").exec()
    }
    
    async getAllProducts(userCountry?: string): Promise<IProduct[]> {
        const query: any = {};
        
        // Filter by country if provided
        if (userCountry) {
            query.availableCountries = { $in: [userCountry] };
        }
        
        return ProductModel.find(query).populate("userId", "name email role").exec()
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

    async getProductsByMark(type: string, userCountry?: string): Promise<IProduct[]> {
        const filter: any = {};
        
        // Filter by country if provided
        if (userCountry) {
            filter.availableCountries = { $in: [userCountry] };
        }
        
        switch (type.toLowerCase()) {
            case 'special':
            case 'specials':
                filter.isSpecial = true;
                break;
            case 'trending':
                filter.isTrending = true;
                break;
            case 'bestseller':
            case 'best-seller':
                filter.isBestSeller = true;
                break;
            case 'mditems':
            case 'md-items':
                filter.isMDItemsLive = true;
                break;
            default:
                throw new Error("Invalid mark type. Use: special, trending, bestseller, or mditems");
        }
        
        return ProductModel.find(filter)
            .populate("userId", "name email role")
            .exec();
    }
}

export const productService = new ProductService();