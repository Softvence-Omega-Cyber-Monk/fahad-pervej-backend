// src/controllers/cms.controller.ts
import { Request, Response } from 'express';
import { Topbar, Hero, Footer } from './cms.model'; // Fixed path

// ========== TOPBAR CONTROLLERS ==========
export const getTopbar = async (req: Request, res: Response) => {
  try {
    const topbar = await Topbar.findOne({ isActive: true }).sort({ createdAt: -1 });
    
    if (!topbar) {
      return res.status(404).json({
        success: false,
        message: 'No active topbar found',
      });
    }

    res.status(200).json({
      success: true,
      data: topbar,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching topbar',
      error: error instanceof Error ? error.message : 'Unknown error',
    });
  }
};

export const createTopbar = async (req: Request, res: Response) => {
  try {
    const { backgroundColor, textColor, content, isActive } = req.body;

    // If this topbar is active, deactivate all others
    if (isActive) {
      await Topbar.updateMany({}, { isActive: false });
    }

    const topbar = await Topbar.create({
      backgroundColor,
      textColor,
      content,
      isActive,
    });

    res.status(201).json({
      success: true,
      message: 'Topbar created successfully',
      data: topbar,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error creating topbar',
      error: error instanceof Error ? error.message : 'Unknown error',
    });
  }
};

export const updateTopbar = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { backgroundColor, textColor, content, isActive } = req.body;

    // If this topbar is being set to active, deactivate all others
    if (isActive) {
      await Topbar.updateMany({ _id: { $ne: id } }, { isActive: false });
    }

    const topbar = await Topbar.findByIdAndUpdate(
      id,
      { backgroundColor, textColor, content, isActive },
      { new: true, runValidators: true }
    );

    if (!topbar) {
      return res.status(404).json({
        success: false,
        message: 'Topbar not found',
      });
    }

    res.status(200).json({
      success: true,
      message: 'Topbar updated successfully',
      data: topbar,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error updating topbar',
      error: error instanceof Error ? error.message : 'Unknown error',
    });
  }
};

export const getAllTopbars = async (req: Request, res: Response) => {
  try {
    const topbars = await Topbar.find().sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      data: topbars,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching topbars',
      error: error instanceof Error ? error.message : 'Unknown error',
    });
  }
};

export const deleteTopbar = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    const topbar = await Topbar.findByIdAndDelete(id);

    if (!topbar) {
      return res.status(404).json({
        success: false,
        message: 'Topbar not found',
      });
    }

    res.status(200).json({
      success: true,
      message: 'Topbar deleted successfully',
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error deleting topbar',
      error: error instanceof Error ? error.message : 'Unknown error',
    });
  }
};

// ========== HERO CONTROLLERS ==========
export const getHero = async (req: Request, res: Response) => {
  try {
    const hero = await Hero.findOne({ isActive: true }).sort({ createdAt: -1 });
    
    if (!hero) {
      return res.status(404).json({
        success: false,
        message: 'No active hero section found',
      });
    }

    res.status(200).json({
      success: true,
      data: hero,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching hero section',
      error: error instanceof Error ? error.message : 'Unknown error',
    });
  }
};

export const createHero = async (req: Request, res: Response) => {
  try {
    const { title, description, image, buttonText, buttonLink, isActive, overlayOpacity } = req.body;

    // If this hero is active, deactivate all others
    if (isActive) {
      await Hero.updateMany({}, { isActive: false });
    }

    const hero = await Hero.create({
      title,
      description,
      image,
      buttonText,
      buttonLink,
      isActive,
      overlayOpacity,
    });

    res.status(201).json({
      success: true,
      message: 'Hero section created successfully',
      data: hero,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error creating hero section',
      error: error instanceof Error ? error.message : 'Unknown error',
    });
  }
};

export const updateHero = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { title, description, image, buttonText, buttonLink, isActive, overlayOpacity } = req.body;

    // If this hero is being set to active, deactivate all others
    if (isActive) {
      await Hero.updateMany({ _id: { $ne: id } }, { isActive: false });
    }

    const hero = await Hero.findByIdAndUpdate(
      id,
      { title, description, image, buttonText, buttonLink, isActive, overlayOpacity },
      { new: true, runValidators: true }
    );

    if (!hero) {
      return res.status(404).json({
        success: false,
        message: 'Hero section not found',
      });
    }

    res.status(200).json({
      success: true,
      message: 'Hero section updated successfully',
      data: hero,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error updating hero section',
      error: error instanceof Error ? error.message : 'Unknown error',
    });
  }
};

export const getAllHeroes = async (req: Request, res: Response) => {
  try {
    const heroes = await Hero.find().sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      data: heroes,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching hero sections',
      error: error instanceof Error ? error.message : 'Unknown error',
    });
  }
};

export const deleteHero = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    const hero = await Hero.findByIdAndDelete(id);

    if (!hero) {
      return res.status(404).json({
        success: false,
        message: 'Hero section not found',
      });
    }

    res.status(200).json({
      success: true,
      message: 'Hero section deleted successfully',
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error deleting hero section',
      error: error instanceof Error ? error.message : 'Unknown error',
    });
  }
};

// ========== FOOTER CONTROLLERS ==========
export const getFooter = async (req: Request, res: Response) => {
  try {
    const footer = await Footer.findOne({ isActive: true }).sort({ createdAt: -1 });
    
    if (!footer) {
      return res.status(404).json({
        success: false,
        message: 'No active footer found',
      });
    }

    res.status(200).json({
      success: true,
      data: footer,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching footer',
      error: error instanceof Error ? error.message : 'Unknown error',
    });
  }
};

export const createFooter = async (req: Request, res: Response) => {
  try {
    const { logo, description, address, email, phone, socialLinks, copyright, isActive } = req.body;

    // If this footer is active, deactivate all others
    if (isActive) {
      await Footer.updateMany({}, { isActive: false });
    }

    const footer = await Footer.create({
      logo,
      description,
      address,
      email,
      phone,
      socialLinks,
      copyright,
      isActive,
    });

    res.status(201).json({
      success: true,
      message: 'Footer created successfully',
      data: footer,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error creating footer',
      error: error instanceof Error ? error.message : 'Unknown error',
    });
  }
};

export const updateFooter = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { logo, description, address, email, phone, socialLinks, copyright, isActive } = req.body;

    // If this footer is being set to active, deactivate all others
    if (isActive) {
      await Footer.updateMany({ _id: { $ne: id } }, { isActive: false });
    }

    const footer = await Footer.findByIdAndUpdate(
      id,
      { logo, description, address, email, phone, socialLinks, copyright, isActive },
      { new: true, runValidators: true }
    );

    if (!footer) {
      return res.status(404).json({
        success: false,
        message: 'Footer not found',
      });
    }

    res.status(200).json({
      success: true,
      message: 'Footer updated successfully',
      data: footer,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error updating footer',
      error: error instanceof Error ? error.message : 'Unknown error',
    });
  }
};

export const getAllFooters = async (req: Request, res: Response) => {
  try {
    const footers = await Footer.find().sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      data: footers,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching footers',
      error: error instanceof Error ? error.message : 'Unknown error',
    });
  }
};

export const deleteFooter = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    const footer = await Footer.findByIdAndDelete(id);

    if (!footer) {
      return res.status(404).json({
        success: false,
        message: 'Footer not found',
      });
    }

    res.status(200).json({
      success: true,
      message: 'Footer deleted successfully',
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error deleting footer',
      error: error instanceof Error ? error.message : 'Unknown error',
    });
  }
};