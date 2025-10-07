// src/controllers/cms.controller.ts

import { Request, Response, NextFunction } from 'express';
import { ICMSPageCreate, ICMSPageUpdate } from './cms.interface';
import { CMSService } from './cms.service';

export class CMSController {
  private cmsService: CMSService;

  constructor() {
    this.cmsService = new CMSService();
  }

  // Get all CMS pages
  getAllPages = async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      const query = {
        page: parseInt(req.query.page as string) || 1,
        limit: parseInt(req.query.limit as string) || 10,
        search: (req.query.search as string) || '',
        isActive:
          req.query.isActive === 'true'
            ? true
            : req.query.isActive === 'false'
            ? false
            : undefined,
        sortBy: (req.query.sortBy as string) || 'createdAt',
        sortOrder: (req.query.sortOrder as 'asc' | 'desc') || 'desc',
      };

      const result = await this.cmsService.getAllPages(query);

      res.status(200).json({
        success: true,
        message: 'CMS pages retrieved successfully',
        ...result,
      });
    } catch (error) {
      next(error);
    }
  };

  // Get single CMS page by ID
  getPageById = async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      const pageId = parseInt(req.params.id);

      if (isNaN(pageId)) {
        res.status(400).json({
          success: false,
          message: 'Invalid page ID',
        });
        return;
      }

      const page = await this.cmsService.getPageById(pageId);

      if (!page) {
        res.status(404).json({
          success: false,
          message: 'Page not found',
        });
        return;
      }

      res.status(200).json({
        success: true,
        message: 'Page retrieved successfully',
        data: page,
      });
    } catch (error) {
      next(error);
    }
  };

  // Get page by URL key
  getPageByUrlKey = async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      const { urlKey } = req.params;

      const page = await this.cmsService.getPageByUrlKey(urlKey);

      if (!page) {
        res.status(404).json({
          success: false,
          message: 'Page not found',
        });
        return;
      }

      res.status(200).json({
        success: true,
        message: 'Page retrieved successfully',
        data: page,
      });
    } catch (error) {
      next(error);
    }
  };

  // Create new CMS page
  createPage = async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      const data: ICMSPageCreate = req.body;

      const page = await this.cmsService.createPage(data);

      res.status(201).json({
        success: true,
        message: 'Page created successfully',
        data: page,
      });
    } catch (error: any) {
      if (error.message === 'URL key already exists') {
        res.status(409).json({
          success: false,
          message: error.message,
        });
        return;
      }
      next(error);
    }
  };

  // Update CMS page
  updatePage = async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      const pageId = parseInt(req.params.id);
      const data: ICMSPageUpdate = req.body;

      if (isNaN(pageId)) {
        res.status(400).json({
          success: false,
          message: 'Invalid page ID',
        });
        return;
      }

      const page = await this.cmsService.updatePage(pageId, data);

      if (!page) {
        res.status(404).json({
          success: false,
          message: 'Page not found',
        });
        return;
      }

      res.status(200).json({
        success: true,
        message: 'Page updated successfully',
        data: page,
      });
    } catch (error: any) {
      if (error.message === 'URL key already exists') {
        res.status(409).json({
          success: false,
          message: error.message,
        });
        return;
      }
      next(error);
    }
  };

  // Delete CMS page
  deletePage = async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      const pageId = parseInt(req.params.id);

      if (isNaN(pageId)) {
        res.status(400).json({
          success: false,
          message: 'Invalid page ID',
        });
        return;
      }

      const deleted = await this.cmsService.deletePage(pageId);

      if (!deleted) {
        res.status(404).json({
          success: false,
          message: 'Page not found',
        });
        return;
      }

      res.status(200).json({
        success: true,
        message: 'Page deleted successfully',
      });
    } catch (error) {
      next(error);
    }
  };

  // Delete multiple pages
  deletePages = async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      const { ids } = req.body;

      if (!Array.isArray(ids) || ids.length === 0) {
        res.status(400).json({
          success: false,
          message: 'Invalid IDs array',
        });
        return;
      }

      const deletedCount = await this.cmsService.deletePages(ids);

      res.status(200).json({
        success: true,
        message: `${deletedCount} page(s) deleted successfully`,
        deletedCount,
      });
    } catch (error) {
      next(error);
    }
  };

  // Toggle page active status
  togglePageStatus = async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      const pageId = parseInt(req.params.id);

      if (isNaN(pageId)) {
        res.status(400).json({
          success: false,
          message: 'Invalid page ID',
        });
        return;
      }

      const page = await this.cmsService.togglePageStatus(pageId);

      if (!page) {
        res.status(404).json({
          success: false,
          message: 'Page not found',
        });
        return;
      }

      res.status(200).json({
        success: true,
        message: 'Page status updated successfully',
        data: page,
      });
    } catch (error) {
      next(error);
    }
  };
}