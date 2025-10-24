import { Schema } from "mongoose";

export interface Payment {
    customerId: Schema.Types.ObjectId,
    sellerId: Schema.Types.ObjectId,
    adminId: Schema.Types.ObjectId,
    amount: number,
    deliveryFee?: number,
    status: 'PENDING' | 'PAID' | 'COMPLETED',
    heldAmount: number,
    adminAmount: number,
    sellerAmount: number,
    
}