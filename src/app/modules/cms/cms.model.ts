// src/models/cms.model.ts

import mongoose, { Schema, Document } from 'mongoose';
import { ICMSPage } from './cms.interface';

export interface ICMSPageDocument extends Omit<ICMSPage, 'pageId'>, Document {
  pageId: number;
}

const CMSPageSchema = new Schema<ICMSPageDocument>(
  {
    pageId: {
      type: Number,
      unique: true,
    },
    pageTitle: {
      type: String,
      required: [true, 'Page title is required'],
      trim: true,
      maxlength: [200, 'Page title cannot exceed 200 characters'],
    },
    urlKey: {
      type: String,
      required: [true, 'URL key is required'],
      unique: true,
      trim: true,
      lowercase: true,
      match: [
        /^[a-z0-9-]+$/,
        'URL key can only contain lowercase letters, numbers, and hyphens',
      ],
    },
    content: {
      type: String,
      required: [true, 'Content is required'],
    },
    mainTitle: {
      type: String,
      required: [true, 'Main title is required'],
      trim: true,
      maxlength: [300, 'Main title cannot exceed 300 characters'],
    },
    metaKeywords: {
      type: String,
      trim: true,
      maxlength: [500, 'Meta keywords cannot exceed 500 characters'],
    },
    metaDescription: {
      type: String,
      trim: true,
      maxlength: [1000, 'Meta description cannot exceed 1000 characters'],
    },
    isActive: {
      type: Boolean,
      default: true,
    },
  },
  {
    timestamps: true,
    versionKey: false,
  }
);

// Auto-increment ID
CMSPageSchema.pre('save', async function (next) {
  if (!this.pageId) {
    const lastPage = await CMSPageModel.findOne().sort({ pageId: -1 });
    this.pageId = lastPage ? lastPage.pageId + 1 : 1;
  }
  next();
});

// Indexes for performance
CMSPageSchema.index({ pageTitle: 1 });
CMSPageSchema.index({ urlKey: 1 });
CMSPageSchema.index({ isActive: 1 });
CMSPageSchema.index({ createdAt: -1 });
CMSPageSchema.index({ pageId: 1 });

export const CMSPageModel = mongoose.model<ICMSPageDocument>(
  'CMSPage',
  CMSPageSchema
);