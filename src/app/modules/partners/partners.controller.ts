// src/controllers/partners.controller.ts
import { Request, Response } from 'express';
import { Partner } from './partners.model';
import { uploadToCloudinary } from '../../../utils/cloudinaryUpload';

// Get all partners
export const getAllPartners = async (req: Request, res: Response) => {
  try {
    const partners = await Partner.find({ isActive: true }).sort({ order: 1, createdAt: -1 });
    
    res.status(200).json({
      success: true,
      data: partners,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching partners',
      error: error instanceof Error ? error.message : 'Unknown error',
    });
  }
};

// Get partner by ID
export const getPartnerById = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const partner = await Partner.findById(id);

    if (!partner) {
      return res.status(404).json({
        success: false,
        message: 'Partner not found',
      });
    }

    res.status(200).json({
      success: true,
      data: partner,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching partner',
      error: error instanceof Error ? error.message : 'Unknown error',
    });
  }
};

// Create new partner
export const createPartner = async (req: Request, res: Response) => {
  try {
    const { name, order } = req.body;
    const logoFile = req.file;

    if (!name) {
      return res.status(400).json({
        success: false,
        message: 'Partner name is required',
      });
    }

    if (!logoFile) {
      return res.status(400).json({
        success: false,
        message: 'Partner logo is required',
      });
    }

    const logoUrl = await uploadToCloudinary(logoFile.path, 'partners');

    const partner = await Partner.create({
      logo: logoUrl,
      name,
      order: order !== undefined ? parseInt(order) : 0,
      isActive: true,
    });

    res.status(201).json({
      success: true,
      message: 'Partner created successfully',
      data: partner,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error creating partner',
      error: error instanceof Error ? error.message : 'Unknown error',
    });
  }
};

// Update partner
export const updatePartner = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { name, order } = req.body;
    const logoFile = req.file;

    if (!name) {
      return res.status(400).json({
        success: false,
        message: 'Partner name is required',
      });
    }

    const partner = await Partner.findById(id);

    if (!partner) {
      return res.status(404).json({
        success: false,
        message: 'Partner not found',
      });
    }

    let logoUrl = partner.logo;
    if (logoFile) {
      logoUrl = await uploadToCloudinary(logoFile.path, 'partners');
    }

    partner.logo = logoUrl;
    partner.name = name;
    partner.order = order !== undefined ? parseInt(order) : partner.order;
    await partner.save();

    res.status(200).json({
      success: true,
      message: 'Partner updated successfully',
      data: partner,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error updating partner',
      error: error instanceof Error ? error.message : 'Unknown error',
    });
  }
};

// Delete partner
export const deletePartner = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    const partner = await Partner.findByIdAndDelete(id);

    if (!partner) {
      return res.status(404).json({
        success: false,
        message: 'Partner not found',
      });
    }

    res.status(200).json({
      success: true,
      message: 'Partner deleted successfully',
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error deleting partner',
      error: error instanceof Error ? error.message : 'Unknown error',
    });
  }
};