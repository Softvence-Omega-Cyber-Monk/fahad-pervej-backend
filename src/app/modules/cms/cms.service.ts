// src/services/cms.service.ts

import { CMSPageModel } from './cms.model';
import {
  ICMSPageCreate,
  ICMSPageUpdate,
  ICMSPageQuery,
  IPaginatedResponse,
  ICMSPage,
} from "./cms.interface"

export class CMSService {
  // Get all pages with pagination and filtering
  async getAllPages(
    query: ICMSPageQuery
  ): Promise<IPaginatedResponse<ICMSPage>> {
    const {
      page = 1,
      limit = 10,
      search = '',
      isActive,
      sortBy = 'createdAt',
      sortOrder = 'desc',
    } = query;

    const skip = (page - 1) * limit;
    const filter: any = {};

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
    const sort: any = {};
    sort[sortBy] = sortOrder === 'asc' ? 1 : -1;

    const [data, total] = await Promise.all([
      CMSPageModel.find(filter)
        .sort(sort)
        .skip(skip)
        .limit(limit)
        .select('-_id -__v')
        .lean(),
      CMSPageModel.countDocuments(filter),
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
  async getPageById(pageId: number): Promise<ICMSPage | null> {
    const page = await CMSPageModel.findOne({ pageId })
      .select('-_id -__v')
      .lean();
    return page;
  }

  // Get page by URL key
  async getPageByUrlKey(urlKey: string): Promise<ICMSPage | null> {
    const page = await CMSPageModel.findOne({ urlKey })
      .select('-_id -__v')
      .lean();
    return page;
  }

  // Create new page
  async createPage(data: ICMSPageCreate): Promise<ICMSPage> {
    // Check if URL key already exists
    const existingPage = await CMSPageModel.findOne({ urlKey: data.urlKey });
    if (existingPage) {
      throw new Error('URL key already exists');
    }

    const page = new CMSPageModel(data);
    await page.save();
    
    const result = page.toObject();
    delete result._id;
    
    return result;
  }

  // Update page
  async updatePage(pageId: number, data: ICMSPageUpdate): Promise<ICMSPage | null> {
    // If updating URL key, check if it already exists
    if (data.urlKey) {
      const existingPage = await CMSPageModel.findOne({
        urlKey: data.urlKey,
        pageId: { $ne: pageId },
      });
      if (existingPage) {
        throw new Error('URL key already exists');
      }
    }

    const page = await CMSPageModel.findOneAndUpdate(
      { pageId },
      { $set: data },
      { new: true, runValidators: true }
    )
      .select('-_id -__v')
      .lean();

    return page;
  }

  // Delete page
  async deletePage(pageId: number): Promise<boolean> {
    const result = await CMSPageModel.deleteOne({ pageId });
    return result.deletedCount > 0;
  }

  // Delete multiple pages
  async deletePages(pageIds: number[]): Promise<number> {
    const result = await CMSPageModel.deleteMany({ pageId: { $in: pageIds } });
    return result.deletedCount;
  }

  // Toggle page active status
  async togglePageStatus(pageId: number): Promise<ICMSPage | null> {
    const page = await CMSPageModel.findOne({ pageId });
    if (!page) return null;

    page.isActive = !page.isActive;
    await page.save();

    const result = page.toObject();
    delete result._id;
    
    return result;
  }
}