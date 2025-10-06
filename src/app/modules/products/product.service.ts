import { IBulkProduct, IProduct } from "./product.interface";
import { ProductModel } from "./product.model";

class ProductService {
    async createProduct(data: IProduct) : Promise<IProduct>{
        const product = await ProductModel.create(data);
        return product
    }
    async createBulkProducts(products: IBulkProduct): Promise<IProduct[]>{
        const inserted = await ProductModel.insertMany(products);
        return inserted
    }
    async getProductById(id: string) : Promise<IProduct | null>{
        return ProductModel.findById(id).exec()
    }
    async getAllProducts(): Promise<IProduct[]>{
        return ProductModel.find().exec()
    }
}