// src/models/partners.model.ts
import mongoose, { Schema, Document } from 'mongoose';

// Partners Interface
export interface IPartner extends Document {
  logo: string;
  name: string;
  order: number;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

// Partners Schema
const PartnerSchema = new Schema<IPartner>(
  {
    logo: {
      type: String,
      required: true,
    },
    name: {
      type: String,
      required: true,
    },
    order: {
      type: Number,
      default: 0,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
  },
  { timestamps: true }
);

export const Partner = mongoose.model<IPartner>('Partner', PartnerSchema);