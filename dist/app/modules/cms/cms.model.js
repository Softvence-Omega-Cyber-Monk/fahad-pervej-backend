"use strict";
// src/models/cms.model.ts
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.CMSPageModel = void 0;
const mongoose_1 = __importStar(require("mongoose"));
const CMSPageSchema = new mongoose_1.Schema({
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
}, {
    timestamps: true,
    versionKey: false,
});
// Auto-increment ID
CMSPageSchema.pre('save', async function (next) {
    if (!this.pageId) {
        const lastPage = await exports.CMSPageModel.findOne().sort({ pageId: -1 });
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
exports.CMSPageModel = mongoose_1.default.model('CMSPage', CMSPageSchema);
