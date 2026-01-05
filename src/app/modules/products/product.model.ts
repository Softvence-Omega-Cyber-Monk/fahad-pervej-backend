import { model, Schema } from "mongoose";
import { IProduct } from "./product.interface";

const countryPriceSchema = new Schema({
  country: { type: String, required: true },
  currency: { type: String, required: true },
  pricePerUnit: { type: Number, required: true },
  specialPrice: { type: Number },
}, { _id: false });

const productSchema = new Schema<IProduct>({
  productName: { type: String, required: true },
  productCategory: { type: Schema.Types.ObjectId, ref: "Category", required: true },
  productSKU: { type: String, required: true, unique: true },
  companyName: { type: String },
  gender: { type: String },
  availableSize: { type: String },
  productDescription: { type: String, required: true },
  stock: { type: Number, required: true },
  
  // Deprecated fields - keep for backward compatibility
  currency: { type: String },
  pricePerUnit: { type: Number },
  specialPrice: { type: Number },
  
  // New multi-country pricing
  countryPricing: {
    type: [countryPriceSchema],
    required: true,
    validate: {
      validator: function(v: any[]) {
        return v && v.length > 0;
      },
      message: "At least one country pricing is required"
    }
  },
  availableCountries: { type: [String], required: true },
  
  specialPriceStartingDate: { type: Date },
  specialPriceEndingDate: { type: Date },
  mainImageUrl: { type: String },
  sideImageUrl: { type: String },
  sideImage2Url: { type: String },
  lastImageUrl: { type: String },
  videoUrl: { type: String },
  width: { type: Number },
  height: { type: Number },
  length: { type: Number },
  weight: { type: Number, required: true },
  userId: { type: Schema.Types.ObjectId, ref: "User", required: true },
  
  // ✨ NEW: Product Marking Features
  isSpecial: { type: Boolean, default: false },
  isTrending: { type: Boolean, default: false },
  isBestSeller: { type: Boolean, default: false },
  isMDItemsLive: { type: Boolean, default: false },
}, {
  timestamps: true
});

// Create indexes for faster filtering
productSchema.index({ isSpecial: 1 });
productSchema.index({ isTrending: 1 });
productSchema.index({ isBestSeller: 1 });
productSchema.index({ isMDItemsLive: 1 });

export const ProductModel = model<IProduct>("Product", productSchema);