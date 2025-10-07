"use strict";
// src/services/cms.service.ts
Object.defineProperty(exports, "__esModule", { value: true });
exports.CMSService = void 0;
const cms_model_1 = require("./cms.model");
class CMSService {
    // Get all pages with pagination and filtering
    async getAllPages(query) {
        const { page = 1, limit = 10, search = '', isActive, sortBy = 'createdAt', sortOrder = 'desc', } = query;
        const skip = (page - 1) * limit;
        const filter = {};
        // Search filter
        if (search) {
            filter.$or = [
                { pageTitle: { $regex: search, $options: 'i' } },
                { urlKey: { $regex: search, $options: 'i' } },
                { mainTitle: { $regex: search, $options: 'i' } },
            ];
        }
        // Active filter
        if (isActive !== undefined) {
            filter.isActive = isActive;
        }
        // Sort order
        const sort = {};
        sort[sortBy] = sortOrder === 'asc' ? 1 : -1;
        const [data, total] = await Promise.all([
            cms_model_1.CMSPageModel.find(filter)
                .sort(sort)
                .skip(skip)
                .limit(limit)
                .select('-_id -__v')
                .lean(),
            cms_model_1.CMSPageModel.countDocuments(filter),
        ]);
        return {
            data,
            pagination: {
                page,
                limit,
                total,
                totalPages: Math.ceil(total / limit),
            },
        };
    }
    // Get single page by ID
    async getPageById(pageId) {
        const page = await cms_model_1.CMSPageModel.findOne({ pageId })
            .select('-_id -__v')
            .lean();
        return page;
    }
    // Get page by URL key
    async getPageByUrlKey(urlKey) {
        const page = await cms_model_1.CMSPageModel.findOne({ urlKey })
            .select('-_id -__v')
            .lean();
        return page;
    }
    // Create new page
    async createPage(data) {
        // Check if URL key already exists
        const existingPage = await cms_model_1.CMSPageModel.findOne({ urlKey: data.urlKey });
        if (existingPage) {
            throw new Error('URL key already exists');
        }
        const page = new cms_model_1.CMSPageModel(data);
        await page.save();
        const result = page.toObject();
        delete result._id;
        return result;
    }
    // Update page
    async updatePage(pageId, data) {
        // If updating URL key, check if it already exists
        if (data.urlKey) {
            const existingPage = await cms_model_1.CMSPageModel.findOne({
                urlKey: data.urlKey,
                pageId: { $ne: pageId },
            });
            if (existingPage) {
                throw new Error('URL key already exists');
            }
        }
        const page = await cms_model_1.CMSPageModel.findOneAndUpdate({ pageId }, { $set: data }, { new: true, runValidators: true })
            .select('-_id -__v')
            .lean();
        return page;
    }
    // Delete page
    async deletePage(pageId) {
        const result = await cms_model_1.CMSPageModel.deleteOne({ pageId });
        return result.deletedCount > 0;
    }
    // Delete multiple pages
    async deletePages(pageIds) {
        const result = await cms_model_1.CMSPageModel.deleteMany({ pageId: { $in: pageIds } });
        return result.deletedCount;
    }
    // Toggle page active status
    async togglePageStatus(pageId) {
        const page = await cms_model_1.CMSPageModel.findOne({ pageId });
        if (!page)
            return null;
        page.isActive = !page.isActive;
        await page.save();
        const result = page.toObject();
        delete result._id;
        return result;
    }
}
exports.CMSService = CMSService;
