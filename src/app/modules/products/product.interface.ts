import { Document, Schema } from "mongoose";

export interface ICountryPrice {
  country: string;
  currency: string;
  pricePerUnit: number;
  specialPrice?: number;
}

export interface IProduct extends Document {
  productName: string;
  productCategory: Schema.Types.ObjectId;
  productSKU: string;
  companyName: string;
  gender: string;
  availableSize: string;
  productDescription: string;
  stock: number;
  // Deprecated - keep for backward compatibility
  currency?: string;
  pricePerUnit?: number;
  specialPrice?: number;
  // New multi-country pricing
  countryPricing: ICountryPrice[];
  availableCountries: string[];
  specialPriceStartingDate?: Date | string;
  specialPriceEndingDate?: Date | string;
  mainImageUrl?: string;
  sideImageUrl?: string;
  sideImage2Url?: string;
  lastImageUrl?: string;
  videoUrl?: string;
  createdAt: Date;
  updatedAt: Date;
  width?: number;
  height?: number;
  length?: number;
  weight: number;
  userId: Schema.Types.ObjectId;
}

export type IBulkProduct = IProduct[];