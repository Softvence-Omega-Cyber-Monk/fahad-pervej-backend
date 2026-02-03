import { Document, Types } from "mongoose";

export enum ShippingLocation {
    LOCAL = "Local within city state",
    NATIONAL = "National within country",
    INTERNATIONAL = "International"
}

export enum PaymentMethod {
    BANK_ACCOUNT = "Bank Account",
    PAYPAL = "Paypal",
    STRIPE = "Stripe"
}

// Origin Address interface
export interface IOriginAddress {
  Line1: string;
  Line2?: string;
  Line3?: string;
  City: string;
  PostCode: string;
  CountryCode: string;
}
// Shipping Address interface for customers
export interface IShippingAddress {
  phone: string;
  country: string;
  address: string;   // street line
  city: string;
  state: string;
  postalCode: string;
}
export interface IUser extends Document {
  name: string;
  email: string;
  password: string;
  role: "ADMIN" | "VENDOR" | "CUSTOMER";
  isActive: boolean;
  profileImage?: string;
  deactivationReason?: string;
  isVerified?: boolean; 
  businessName?: string;
  businessCRNumber?: string;
  CRDocuments?: string;
  CRDocumentsPublicId?: string;
  CRDocumentsFormat?: string;
  CRDocumentsSignedUrl?: string;
  businessType?: string;
  businessDescription?: string;
  country?: string;
  shippingAddress?: IShippingAddress;
  
  // Origin Address for shipping
  originAddress?: IOriginAddress;
  
  productCategory?: string[] | Types.ObjectId[];
  shippingLocation?: ShippingLocation[] | string[];
  storeDescription?: string;
  paymentMethod?: PaymentMethod;
  bankAccountHolderName?: string;
  bankAccountNumber?: string;
  bankRoughingNumber?: string;
  taxId?: string;
  isPrivacyPolicyAccepted?: boolean;
  vendorSignature?: string;
  vendorContract?: string;
  vendorContractPublicId?: string;
  vendorContractFormat?: string;
  vendorContractSignedUrl?: string;
  isSellerPolicyAccepted?: boolean;
  address?: string;
  phone?: string | null;
  orderNotification?: string;
  promotionNotification?: string;
  communicationAlert?: string;
  newReviewsNotification?: string;
  createdAt: Date;
  updatedAt: Date;
  language: string;
  currency: string;
  holdingTime: number;
  categories: string[];  
  storeBanner: string;
  
  comparePassword(candidatePassword: string): Promise<boolean>;
}
